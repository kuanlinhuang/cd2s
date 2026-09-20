"""Assign one controlled cancer subject without claiming beyond measured evidence.

The mapping is pinned to OncoTree 2025-10-03. Repository-stated subjects may admit a
record to a topic shortlist. Title-derived subjects support browsing only.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import TYPE_CHECKING, Any

from cds.model import Confidence, Evidence, Method, Subject, SubjectScope

if TYPE_CHECKING:
    from cds.model import DatasetRecord


TISSUES: dict[str, dict[str, str]] = {
    "ADRENAL_GLAND": {"name": "Adrenal Gland", "label": "Adrenal gland", "nci": "C12666"},
    "AMPULLA_OF_VATER": {"name": "Ampulla of Vater", "label": "Ampulla of Vater", "nci": "C13011"},
    "BILIARY_TRACT": {"name": "Biliary Tract", "label": "Biliary tract", "nci": "C12678"},
    "BLADDER": {
        "name": "Bladder/Urinary Tract",
        "label": "Bladder and urinary tract",
        "nci": "C12414",
    },
    "BONE": {"name": "Bone", "label": "Bone", "nci": "C12366"},
    "BOWEL": {"name": "Bowel", "label": "Colorectal and bowel", "nci": "C12736"},
    "BREAST": {"name": "Breast", "label": "Breast", "nci": "C12971"},
    "BRAIN": {"name": "CNS/Brain", "label": "Brain and central nervous system", "nci": "C12438"},
    "CERVIX": {"name": "Cervix", "label": "Cervix", "nci": "C12311"},
    "STOMACH": {"name": "Esophagus/Stomach", "label": "Esophagus and stomach", "nci": "C12391"},
    "EYE": {"name": "Eye", "label": "Eye", "nci": "C12401"},
    "HEAD_NECK": {"name": "Head and Neck", "label": "Head and neck", "nci": "C12418"},
    "KIDNEY": {"name": "Kidney", "label": "Kidney", "nci": "C12415"},
    "LIVER": {"name": "Liver", "label": "Liver", "nci": "C12392"},
    "LUNG": {"name": "Lung", "label": "Lung", "nci": "C12468"},
    "LYMPH": {"name": "Lymphoid", "label": "Lymphoid", "nci": "C13252"},
    "MYELOID": {"name": "Myeloid", "label": "Myeloid", "nci": "C12434"},
    "OVARY": {"name": "Ovary/Fallopian Tube", "label": "Ovary and fallopian tube", "nci": "C12404"},
    "PANCREAS": {"name": "Pancreas", "label": "Pancreas", "nci": "C12393"},
    "PENIS": {"name": "Penis", "label": "Penis", "nci": "C12409"},
    "PNS": {
        "name": "Peripheral Nervous System",
        "label": "Peripheral nervous system",
        "nci": "C12465",
    },
    "PERITONEUM": {"name": "Peritoneum", "label": "Peritoneum", "nci": "C12770"},
    "PLEURA": {"name": "Pleura", "label": "Pleura", "nci": "C12469"},
    "PROSTATE": {"name": "Prostate", "label": "Prostate", "nci": "C12410"},
    "SKIN": {"name": "Skin", "label": "Skin", "nci": "C12470"},
    "SOFT_TISSUE": {"name": "Soft Tissue", "label": "Soft tissue", "nci": "C12471"},
    "TESTIS": {"name": "Testis", "label": "Testis", "nci": "C12412"},
    "THYMUS": {"name": "Thymus", "label": "Thymus", "nci": "C12433"},
    "THYROID": {"name": "Thyroid", "label": "Thyroid", "nci": "C12400"},
    "UTERUS": {"name": "Uterus", "label": "Uterus", "nci": "C12405"},
    "VULVA": {"name": "Vulva/Vagina", "label": "Vulva and vagina", "nci": "C12408"},
}
NAME_TO_CODE = {item["name"]: code for code, item in TISSUES.items()}


PAN_THRESHOLD = 4  # distinct tissues across both fields at or above which a record is pan_cancer

# Filing values and body regions. They name nothing and never count as evidence for or against a subject.
FILING_PLACEHOLDERS = {
    "abdomen",
    "arm",
    "blood",
    "bone element",
    "bone marrow",
    "buttock",
    "chest",
    "chest-abdomen-pelvis",
    "colon precancer",
    "extremities",
    "genitourinary system",
    "head",
    "leg",
    "lspine",
    "lymph node",
    "marrow",
    "mediastinum",
    "metastatic disease",
    "mixed cancer types",
    "not applicable",
    "not reported",
    "other",
    "other and ill-defined digestive organs",
    "other and ill-defined sites",
    "other and ill-defined sites within respiratory system and intrathoracic organs",
    "other and unspecified female genital organs",
    "other and unspecified male genital organs",
    "other endocrine glands and related structures",
    "pathologically benign",
    "pelvis",
    "retroperitoneum",
    "scapula",
    "shoulder",
    "tissue",
    "tspine",
    "unknown",
    "various",
    "whole body",
}

# ICD-O morphology groups and organless histology words. Real statements about cases that name no organ;
# they never become a subject but they DO compete with histology-defined strings in the majority rule.
MORPHOLOGY_GROUPS = {
    "acinar cell neoplasms",
    "adenocarcinoma",
    "adenomas and adenocarcinomas",
    "adnexal and skin appendage neoplasms",
    "basal cell neoplasms",
    "carcinosarcoma",
    "clear cell carcinoma",
    "complex epithelial neoplasms",
    "complex mixed and stromal neoplasms",
    "cystic, mucinous and serous neoplasms",
    "ductal adenocarcinoma",
    "ductal and lobular neoplasms",
    "epithelial neoplasms, nos",
    "fibroepithelial neoplasms",
    "germ cell neoplasms",
    "miscellaneous tumors",
    "mucinous adenocarcinoma",
    "mucoepidermoid neoplasms",
    "neoplasms, nos",
    "neuroendocrine cancer (nos)",
    "neuroendocrine carcinoma",
    "neuroendocrine neoplasms",
    "odontogenic tumors",
    "specialized gonadal neoplasms",
    "squamous cell carcinoma",
    "squamous cell neoplasms",
    "transitional cell papillomas and carcinomas",
}

# Anatomical sites that in this corpus are where a cancer was sampled rather than where it began.
SECONDARY_SITES = {
    "bones, joints and articular cartilage of limbs",
    "bones, joints and articular cartilage of other and unspecified sites",
    "connective, subcutaneous and other soft tissues",
    "heart, mediastinum, and pleura",
    "hematopoietic and reticuloendothelial systems",
    "lymph nodes",
    "peripheral nerves and autonomic nervous system",
    "retroperitoneum and peritoneum",
}

NON_CANCER_STRINGS = {
    "brain phantom",
    "covid-19 (non-cancer)",
    "healthy controls (non-cancer)",
    "hemangioma",
    "liver phantom",
    "lung phantom",
    "lymphadenopathy (non-cancer)",
    "non-cancer",
    "non-diseased",
    "normal (non-cancer)",
    "phantom",
}

# Tissues for which a disease string settles the subject on its own (see rule 3).
HISTOLOGY_DECIDES = {
    "Adrenal Gland",
    "Bone",
    "CNS/Brain",
    "Lymphoid",
    "Myeloid",
    "Peripheral Nervous System",
    "Pleura",
    "Skin",
    "Soft Tissue",
    "Thymus",
}

SITE_TO_TISSUE = {
    "accessory sinuses": "Head and Neck",
    "adrenal": "Adrenal Gland",
    "adrenal gland": "Adrenal Gland",
    "adrenal glands": "Adrenal Gland",
    "ampulla_of_vater": "Ampulla of Vater",
    "anus": "Bowel",
    "anus and anal canal": "Bowel",
    "appendix": "Bowel",
    "base of tongue": "Head and Neck",
    "bile duct": "Biliary Tract",
    "biliary tract": "Biliary Tract",
    "bladder": "Bladder/Urinary Tract",
    "bladder organ": "Bladder/Urinary Tract",
    "bladder/urinary tract": "Bladder/Urinary Tract",
    "body of uterus": "Uterus",
    "bone": "Bone",
    "bowel": "Bowel",
    "brain": "CNS/Brain",
    "breast": "Breast",
    "bronchus and lung": "Lung",
    "cervix": "Cervix",
    "cervix uteri": "Cervix",
    "cns/brain": "CNS/Brain",
    "colon": "Bowel",
    "colorectal": "Bowel",
    "corpus uteri": "Uterus",
    "esophagus": "Esophagus/Stomach",
    "esophagus/stomach": "Esophagus/Stomach",
    "eye": "Eye",
    "eye and adnexa": "Eye",
    "floor of mouth": "Head and Neck",
    "gallbladder": "Biliary Tract",
    "gum": "Head and Neck",
    "head and neck": "Head and Neck",
    "head-neck": "Head and Neck",
    "head_neck": "Head and Neck",
    "hypopharynx": "Head and Neck",
    "intraocular": "Eye",
    "kidney": "Kidney",
    "larynx": "Head and Neck",
    "lip": "Head and Neck",
    "liver": "Liver",
    "liver and intrahepatic bile ducts": "Liver",
    "lung": "Lung",
    "meninges": "CNS/Brain",
    "mesothelium": "Pleura",
    "myometrium": "Uterus",
    "nasal cavity and middle ear": "Head and Neck",
    "nasopharynx": "Head and Neck",
    "oral cavity": "Head and Neck",
    "oropharynx": "Head and Neck",
    "other and ill-defined sites in lip, oral cavity and pharynx": "Head and Neck",
    "other and unspecified major salivary glands": "Head and Neck",
    "other and unspecified parts of biliary tract": "Biliary Tract",
    "other and unspecified parts of mouth": "Head and Neck",
    "other and unspecified parts of tongue": "Head and Neck",
    "other and unspecified urinary organs": "Bladder/Urinary Tract",
    "ovary": "Ovary/Fallopian Tube",
    "ovary/fallopian tube": "Ovary/Fallopian Tube",
    "palate": "Head and Neck",
    "pancreas": "Pancreas",
    "parotid gland": "Head and Neck",
    "penis": "Penis",
    "peripheral nervous system": "Peripheral Nervous System",
    "peritoneum": "Peritoneum",
    "pleura": "Pleura",
    "prostate": "Prostate",
    "prostate gland": "Prostate",
    "rectosigmoid junction": "Bowel",
    "rectum": "Bowel",
    "renal pelvis": "Kidney",
    "skin": "Skin",
    "skin of body": "Skin",
    "small intestine": "Bowel",
    "soft tissue": "Soft Tissue",
    "soft_tissue": "Soft Tissue",
    "spinal cord, cranial nerves, and other parts of central nervous system": "CNS/Brain",
    "stomach": "Esophagus/Stomach",
    "testicles": "Testis",
    "testis": "Testis",
    "thymus": "Thymus",
    "thyroid": "Thyroid",
    "thyroid gland": "Thyroid",
    "tonsil": "Head and Neck",
    "trachea": "Lung",
    "ureter": "Bladder/Urinary Tract",
    "uterine cervix": "Cervix",
    "uterus": "Uterus",
    "uterus, nos": "Uterus",
    "vagina": "Vulva/Vagina",
    "vulva": "Vulva/Vagina",
}

DISEASE_TO_TISSUE = {
    "acinar cell carcinoma": "Pancreas",
    "acute lymphoblastic leukemia": "Lymphoid",
    "acute myeloid leukemia": "Myeloid",
    "adenoid cystic carcinoma": "Head and Neck",
    "adrenal cortical carcinoma": "Adrenal Gland",
    "adrenocortical carcinoma": "Adrenal Gland",
    "ampullary carcinoma": "Ampulla of Vater",
    "anal cancer": "Bowel",
    "anal squamous cell carcinoma": "Bowel",
    "appendiceal adenocarcinoma": "Bowel",
    "astrocytoma": "CNS/Brain",
    "b-lymphoblastic leukemia/lymphoma": "Lymphoid",
    "biliary tract": "Biliary Tract",
    "bladder cancer": "Bladder/Urinary Tract",
    "bladder endothelial carcinoma": "Bladder/Urinary Tract",
    "bladder urothelial carcinoma": "Bladder/Urinary Tract",
    "bladder/urinary tract": "Bladder/Urinary Tract",
    "blood vessel tumors": "Soft Tissue",
    "bowel": "Bowel",
    "brain cancer": "CNS/Brain",
    "breast": "Breast",
    "breast cancer": "Breast",
    "breast ductal carcinoma": "Breast",
    "breast invasive carcinoma": "Breast",
    "breast lobular carcinoma": "Breast",
    "burkitt lymphoma": "Lymphoid",
    "cervical cancer": "Cervix",
    "cervical squamous cell carcinoma": "Cervix",
    "cervical squamous cell carcinoma and endocervical adenocarcinoma": "Cervix",
    "cervix": "Cervix",
    "cholangiocarcinoma": "Biliary Tract",
    "chondrosarcoma": "Bone",
    "chromophobe renal cell carcinoma": "Kidney",
    "chronic lymphocytic leukemia/small lymphocytic lymphoma": "Lymphoid",
    "chronic myeloproliferative disorders": "Myeloid",
    "classical hodgkin lymphoma": "Lymphoid",
    "clear cell renal cell carcinoma": "Kidney",
    "colon adenocarcinoma": "Bowel",
    "colon cancer": "Bowel",
    "colon mucinous adenocarcinoma": "Bowel",
    "colorectal adenocarcinoma": "Bowel",
    "colorectal cancer": "Bowel",
    "corpus endometrial carcinoma": "Uterus",
    "cutaneous melanoma": "Skin",
    "cutaneous squamous cell carcinoma": "Skin",
    "diffuse glioma": "CNS/Brain",
    "diffuse large b-cell lymphoma, nos": "Lymphoid",
    "diffuse large b-cell lymphoma": "Lymphoid",
    "early onset gastric cancer": "Esophagus/Stomach",
    "endometrial carcinoma": "Uterus",
    "endocervical adenocarcinoma": "Cervix",
    "esophageal adenocarcinoma": "Esophagus/Stomach",
    "esophageal carcinoma": "Esophagus/Stomach",
    "esophageal squamous cell carcinoma": "Esophagus/Stomach",
    "esophagogastric adenocarcinoma": "Esophagus/Stomach",
    "esophagus/stomach": "Esophagus/Stomach",
    "ewing sarcoma": "Bone",
    "ewing sarcoma - peripheral pnet": "Bone",
    "fibromatous neoplasms": "Soft Tissue",
    "gallbladder cancer": "Biliary Tract",
    "gastroesophageal cancer": "Esophagus/Stomach",
    "gastrointestinal stromal tumor": "Soft Tissue",
    "glioblastoma": "CNS/Brain",
    "glioblastoma multiforme": "CNS/Brain",
    "glioma": "CNS/Brain",
    "gliomas": "CNS/Brain",
    "granular cell tumors and alveolar soft part sarcomas": "Soft Tissue",
    "head and neck": "Head and Neck",
    "head and neck cancer": "Head and Neck",
    "head and neck squamous cell carcinoma": "Head and Neck",
    "hepatocellular carcinoma": "Liver",
    "high-grade serous ovarian cancer": "Ovary/Fallopian Tube",
    "histiocytic and dendritic cell neoplasms": "Myeloid",
    "hodgkin lymphoma": "Lymphoid",
    "intrahepatic cholangiocarcinoma": "Biliary Tract",
    "invasive breast carcinoma": "Breast",
    "invasive breast carcinoma of no special type": "Breast",
    "kidney cancer": "Kidney",
    "kidney chromophobe": "Kidney",
    "kidney renal clear cell carcinoma": "Kidney",
    "kidney renal papillary cell carcinoma": "Kidney",
    "leiomyosarcoma": "Soft Tissue",
    "leukemia": "@heme",
    "leukemias, nos": "@heme",
    "lipomatous neoplasms": "Soft Tissue",
    "liver cancer": "Liver",
    "liver hepatocellular carcinoma": "Liver",
    "low-grade serous ovarian cancer": "Ovary/Fallopian Tube",
    "low grade glioma": "CNS/Brain",
    "lung": "Lung",
    "lung adenocarcinoma": "Lung",
    "lung cancer": "Lung",
    "lung other": "Lung",
    "lung squamous cell carcinoma": "Lung",
    "lymphoid leukemias": "Lymphoid",
    "lymphoma": "Lymphoid",
    "malignant lymphomas, nos or diffuse": "Lymphoid",
    "malignant peripheral nerve sheath tumor": "Peripheral Nervous System",
    "mature b-cell lymphomas": "Lymphoid",
    "mature b-cell neoplasms": "Lymphoid",
    "mature t and nk neoplasms": "Lymphoid",
    "mature t- and nk-cell lymphomas": "Lymphoid",
    "medulloblastoma": "CNS/Brain",
    "melanoma": "Skin",
    "meningioma": "CNS/Brain",
    "meningiomas": "CNS/Brain",
    "merkel cell carcinoma": "Skin",
    "mesothelial neoplasm": "Pleura",
    "mesothelial neoplasms": "Pleura",
    "mesothelioma": "Pleura",
    "miscellaneous bone tumors": "Bone",
    "mucoepidermoid carcinoma": "Head and Neck",
    "multiple myeloma": "Lymphoid",
    "myelodysplastic syndromes": "Myeloid",
    "myeloid": "Myeloid",
    "myeloid leukemias": "Myeloid",
    "myeloid neoplasm": "Myeloid",
    "myomatous neoplasms": "Soft Tissue",
    "myxofibrosarcoma": "Soft Tissue",
    "nasopharyngeal cancer": "Head and Neck",
    "nasopharyngeal carcinoma": "Head and Neck",
    "nerve sheath tumors": "Peripheral Nervous System",
    "neuroblastoma": "Peripheral Nervous System",
    "neuroendocrine cancer (nos)": None,
    "neuroendocrine carcinoma": None,
    "neuroendocrine neoplasms": None,
    "neuroepitheliomatous neoplasms": "Peripheral Nervous System",
    "nevi and melanomas": "Skin",
    "non-clear cell renal cell carcinoma": "Kidney",
    "non-hodgkin lymphoma": "Lymphoid",
    "non-small cell carcinoma": "Lung",
    "non-small cell lung cancer": "Lung",
    "not otherwise specified": None,
    "oral squamous cell carcinoma": "Head and Neck",
    "osseous and chondromatous neoplasms": "Bone",
    "osteosarcoma": "Bone",
    "other leukemias": "@heme",
    "ovarian cancer": "Ovary/Fallopian Tube",
    "ovarian serous cystadenocarcinoma": "Ovary/Fallopian Tube",
    "ovary/fallopian tube": "Ovary/Fallopian Tube",
    "pancreas": "Pancreas",
    "pancreas cancer": "Pancreas",
    "pancreatic adenocarcinoma": "Pancreas",
    "pancreatic cancer": "Pancreas",
    "pancreatic ductal adenocarcinoma": "Pancreas",
    "pancreatic neuroendocrine tumor": "Pancreas",
    "papillary renal cell carcinoma": "Kidney",
    "paragangliomas and glomus tumors": "Adrenal Gland",
    "paraganglioma": "Adrenal Gland",
    "pheochromocytoma": "Adrenal Gland",
    "pediatric/aya brain tumors": "CNS/Brain",
    "pilocytic astrocytoma": "CNS/Brain",
    "pituitary adenoma": "CNS/Brain",
    "plasma cell myeloma": "Lymphoid",
    "plasma cell tumors": "Lymphoid",
    "primary dlbcl of the central nervous system": "Lymphoid",
    "prostate": "Prostate",
    "prostate adenocarcinoma": "Prostate",
    "prostate cancer": "Prostate",
    "rectal adenocarcinoma": "Bowel",
    "rectum adenocarcinoma": "Bowel",
    "renal cell carcinoma": "Kidney",
    "renal non-clear cell carcinoma": "Kidney",
    "retinoblastoma": "Eye",
    "rhabdoid cancer": "Kidney",
    "rhabdomyosarcoma": "Soft Tissue",
    "sarcoma": "Soft Tissue",
    "sarcomas": "Soft Tissue",
    "schwannoma": "Peripheral Nervous System",
    "skin": "Skin",
    "skin cancer": "Skin",
    "skin cutaneous melanoma": "Skin",
    "skin fibrous histiocytoma": "Skin",
    "small cell lung cancer": "Lung",
    "soft tissue": "Soft Tissue",
    "soft tissue tumors and sarcomas, nos": "Soft Tissue",
    "soft-tissue sarcoma": "Soft Tissue",
    "spindle cell sarcoma": "Soft Tissue",
    "stomach adenocarcinoma": "Esophagus/Stomach",
    "synovial sarcoma": "Soft Tissue",
    "synovial-like neoplasms": "Soft Tissue",
    "testis": "Testis",
    "testicular germ cell": "Testis",
    "thymic epithelial neoplasms": "Thymus",
    "thymoma": "Thymus",
    "thyroid": "Thyroid",
    "thyroid cancer": "Thyroid",
    "transitional cell carcinoma": "Bladder/Urinary Tract",
    "unclassified renal cell carcinoma": "Kidney",
    "upper tract urothelial carcinoma": "Bladder/Urinary Tract",
    "urothelial - bladder cancer (nos)": "Bladder/Urinary Tract",
    "urothelial carcinoma": "Bladder/Urinary Tract",
    "uterine adenocarcinoma": "Uterus",
    "uterine corpus endometrial carcinoma": "Uterus",
    "uterine carcinosarcoma": "Uterus",
    "uterine sarcoma/mesenchymal": "Uterus",
    "uveal melanoma": "Eye",
    "lymphoid neoplasm diffuse large b-cell lymphoma": "Lymphoid",
    "vestibular schwannoma (non-cancer)": "Peripheral Nervous System",
    "wilms tumor": "Kidney",
}

SYNONYMS = {
    "Adrenal Gland": [
        "adrenal",
        "adrenal cancer",
        "adrenocortical",
        "paraganglioma",
        "pcpg",
        "pheochromocytoma",
    ],
    "Ampulla of Vater": ["ampulla", "ampullary"],
    "Biliary Tract": [
        "bile duct",
        "biliary",
        "biliary tract",
        "cholangiocarcinoma",
        "gall bladder",
        "gallbladder",
    ],
    "Bladder/Urinary Tract": [
        "bladder",
        "bladder cancer",
        "renal pelvis",
        "upper tract urothelial",
        "ureter",
        "urinary tract",
        "urothelial",
    ],
    "Bone": [
        "bone",
        "bone tumor",
        "bone tumour",
        "chondrosarcoma",
        "ewing",
        "ewing sarcoma",
        "osteosarcoma",
        "sarcoma",
    ],
    "Bowel": [
        "anal",
        "anus",
        "appendiceal",
        "appendix",
        "bowel",
        "colon",
        "colon cancer",
        "colorectal",
        "colorectal cancer",
        "crc",
        "rectal",
        "rectum",
        "small bowel",
        "small intestine",
    ],
    "Breast": ["brca cohort", "breast", "breast cancer", "mammary", "tnbc", "triple negative"],
    "CNS/Brain": [
        "astrocytoma",
        "brain",
        "brain tumor",
        "brain tumour",
        "central nervous system",
        "cns",
        "ependymoma",
        "gbm",
        "glioblastoma",
        "glioma",
        "lower grade glioma",
        "medulloblastoma",
        "meningioma",
        "oligodendroglioma",
        "pituitary",
    ],
    "Cervix": ["cervical", "cervical cancer", "cervix", "cesc"],
    "Esophagus/Stomach": [
        "esophageal",
        "esophagogastric",
        "esophagus",
        "gastric",
        "gastric cancer",
        "gastroesophageal",
        "oesophageal",
        "oesophagus",
        "stomach",
    ],
    "Eye": ["eye", "intraocular", "ocular", "retinoblastoma", "uveal", "uveal melanoma"],
    "Head and Neck": [
        "head and neck",
        "head neck",
        "hnscc",
        "hypopharyngeal",
        "laryngeal",
        "larynx",
        "mouth cancer",
        "nasopharyngeal",
        "nasopharynx",
        "oral",
        "oral cavity",
        "oropharyngeal",
        "oropharynx",
        "salivary",
        "throat cancer",
        "tongue",
    ],
    "Kidney": [
        "ccrcc",
        "chromophobe",
        "clear cell renal",
        "kidney",
        "kidney cancer",
        "papillary renal",
        "rcc",
        "renal",
        "renal cell",
        "renal cell carcinoma",
        "rhabdoid tumor",
        "rhabdoid tumour",
        "wilms",
    ],
    "Liver": [
        "hcc",
        "hepatic",
        "hepatoblastoma",
        "hepatocellular",
        "lihc",
        "liver",
        "liver cancer",
    ],
    "Lung": [
        "luad",
        "lung",
        "lung adenocarcinoma",
        "lung cancer",
        "lung squamous",
        "lusc",
        "non small cell",
        "nsclc",
        "pulmonary",
        "sclc",
        "small cell lung",
    ],
    "Lymphoid": [
        "acute lymphoblastic",
        "acute lymphoblastic leukemia",
        "b cell",
        "burkitt",
        "chronic lymphocytic",
        "chronic lymphocytic leukemia",
        "cll",
        "diffuse large b cell",
        "dlbcl",
        "follicular lymphoma",
        "hodgkin",
        "leukaemia",
        "leukemia",
        "lymphoblastic",
        "lymphoblastic leukemia",
        "lymphocytic leukemia",
        "lymphoid",
        "lymphoma",
        "multiple myeloma",
        "myeloma",
        "non hodgkin",
        "plasma cell",
        "t cell lymphoma",
    ],
    "Myeloid": [
        "acute myeloid",
        "acute myeloid leukaemia",
        "acute myeloid leukemia",
        "aml",
        "chronic myelogenous leukemia",
        "chronic myeloid",
        "chronic myeloid leukemia",
        "clonal hematopoiesis",
        "cml",
        "leukaemia",
        "leukemia",
        "mds",
        "myelodysplastic",
        "myeloid",
        "myeloid leukemia",
        "myeloproliferative",
    ],
    "Ovary/Fallopian Tube": [
        "fallopian",
        "hgsoc",
        "high grade serous",
        "ovarian",
        "ovarian cancer",
        "ovary",
        "serous ovarian",
    ],
    "Pancreas": [
        "ipmn",
        "pancreas",
        "pancreatic",
        "pancreatic cancer",
        "pancreatic ductal",
        "pancreatic neuroendocrine",
        "pdac",
        "pnet",
    ],
    "Penis": ["penile", "penis"],
    "Peripheral Nervous System": [
        "ganglioneuroblastoma",
        "mpnst",
        "nerve sheath",
        "neuroblastoma",
        "peripheral nerve",
        "peripheral nervous system",
        "schwannoma",
    ],
    "Peritoneum": ["peritoneal", "peritoneal mesothelioma", "peritoneum"],
    "Pleura": ["mesothelioma", "pleura", "pleural"],
    "Prostate": [
        "castration resistant",
        "crpc",
        "mcrpc",
        "prostate",
        "prostate cancer",
        "prostatic",
    ],
    "Skin": [
        "basal cell carcinoma",
        "cutaneous",
        "cutaneous squamous",
        "melanoma",
        "merkel",
        "skcm",
        "skin",
        "skin cancer",
    ],
    "Soft Tissue": [
        "angiosarcoma",
        "desmoid",
        "gastrointestinal stromal",
        "gist",
        "leiomyosarcoma",
        "liposarcoma",
        "rhabdomyosarcoma",
        "sarcoma",
        "soft tissue",
        "soft tissue sarcoma",
        "synovial sarcoma",
    ],
    "Testis": [
        "germ cell",
        "germ cell tumor",
        "germ cell tumour",
        "seminoma",
        "testicular",
        "testicular cancer",
        "testis",
        "tgct",
    ],
    "Thymus": ["thymic", "thymic carcinoma", "thymoma", "thymus"],
    "Thyroid": ["anaplastic thyroid", "papillary thyroid", "thca", "thyroid", "thyroid cancer"],
    "Uterus": [
        "carcinosarcoma",
        "endometrial",
        "endometrial cancer",
        "endometrium",
        "ucec",
        "uterine",
        "uterine cancer",
        "uterine sarcoma",
        "uterus",
    ],
    "Vulva/Vagina": ["vagina", "vaginal", "vulva", "vulvar"],
}

ONCOTREE_PATH = Path(__file__).with_name("vocab") / "oncotree_tissues.json"
_ONCOTREE = json.loads(ONCOTREE_PATH.read_text())["nodes"]

# Titles without an organ phrase still describe cross-cancer resources. The exact-title
# entries make that limited inference reviewable and prevent arbitrary free-text guesses.
TITLE_SCOPE_OVERRIDES = {
    "Ukrainian National Research Center for Radiation Medicine Trio Study": [],
    "CPTAC Deep Proteomics 2D-DIA": [],
    "NCI-7 Cell Line Panel": [],
    "NCI-7 Cell Line Panel Experimental Application": [],
    "Reproducible Proteome and Phosphoproteome Workflow BI": [],
    "Reproducible Proteome and Phosphoproteome Workflow JHU": [],
    "Reproducible Proteome and Phosphoproteome Workflow PNNL": [],
    "Human Tumor Atlas Pilot Project (HTAPP)": [],
    "TNP SARDANA": [],
    "Washington University Human Tumor Atlas Research Center": [],
    "Center for Pediatric Tumor Cell Atlas": [],
    "SRRS": [],
    "The Cellular Geography of Therapeutic Resistance in Cancer": [],
    "TNP - TMA": ["BREAST"],
    "Multi-omic Characterization of Transformation of Familial Adenomatous Polyposis": ["BOWEL"],
}


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower().replace("–", "-"))


def classify_string(value: str, kind: str) -> tuple[str, str | None]:
    key = normalize(value)
    if key in NON_CANCER_STRINGS or "(non-cancer)" in key or "phantom" in key:
        return "non_cancer", None
    if key in FILING_PLACEHOLDERS:
        return "placeholder", None
    if key in MORPHOLOGY_GROUPS:
        return "morphology", None
    if kind == "site" and key in SECONDARY_SITES:
        return "secondary", None
    table = DISEASE_TO_TISSUE if kind == "disease" else SITE_TO_TISSUE
    if key in table:
        value = table[key]
        return ("heme", "@heme") if value == "@heme" else ("tissue", value)
    return "unmapped", None


def _codes(names: set[str]) -> list[str]:
    return sorted(NAME_TO_CODE[name] for name in names)


def _title_tissues(title: str) -> tuple[list[str], bool]:
    normalized = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
    matches: list[tuple[str, str]] = []
    for name, phrases in SYNONYMS.items():
        for phrase in phrases:
            candidate = re.sub(r"[^a-z0-9]+", " ", phrase.lower()).strip()
            if re.search(rf"(?<![a-z0-9]){re.escape(candidate)}(?![a-z0-9])", normalized):
                matches.append((candidate, name))
    longest = [
        item
        for item in matches
        if not any(item[0] != other[0] and item[0] in other[0] for other in matches)
    ]
    names = {name for _, name in longest}
    if names:
        return _codes(names), False
    if title in TITLE_SCOPE_OVERRIDES:
        codes = TITLE_SCOPE_OVERRIDES[title]
        return codes, not codes
    return [], False


def _evidence(record: DatasetRecord, confidence: Confidence, note: str) -> Evidence:
    types = ", ".join(term.label for term in record.cancer_types) or "(none)"
    sites = ", ".join(record.primary_sites) or "(none)"
    return Evidence(
        method=Method.DERIVED,
        source_label="cds.subjects",
        locator=f"cancer_types: {types}; primary_sites: {sites}",
        confidence=confidence,
        note=note,
    )


def assign(record: DatasetRecord) -> Subject:
    cancer_values = [term.label for term in record.cancer_types]
    site_values = list(record.primary_sites)

    coded: set[str] = set()
    mixed = False
    for term in record.cancer_types:
        if not term.code:
            continue
        node = _ONCOTREE.get(term.code.lower())
        if not node:
            continue
        tissue = node["tissue"]
        if tissue == "Other" or term.code.lower() == "mixed":
            mixed = True
        elif tissue in NAME_TO_CODE:
            coded.add(NAME_TO_CODE[tissue])
    if coded or mixed:
        if mixed or len(coded) >= PAN_THRESHOLD:
            scope = SubjectScope.PAN_CANCER
            coded = set()
        else:
            scope = SubjectScope.SINGLE if len(coded) == 1 else SubjectScope.SEVERAL
        return Subject(
            scope=scope,
            tissues=sorted(coded),
            evidence=[
                _evidence(record, Confidence.HIGH, "OncoTree code rolled up to its pinned tissue.")
            ],
        )

    disease_names: list[str] = []
    site_names: list[str] = []
    histology_names: list[str] = []
    morphology_count = 0
    non_cancer = False
    pan_marker = False
    for value in cancer_values:
        category, name = classify_string(value, "disease")
        non_cancer |= category == "non_cancer"
        pan_marker |= normalize(value) in {"mixed cancer types", "various"}
        morphology_count += category == "morphology"
        if category == "heme":
            disease_names.extend(["Lymphoid", "Myeloid"])
        elif category == "tissue" and name:
            disease_names.append(name)
            if name in HISTOLOGY_DECIDES:
                histology_names.append(name)
    for value in site_values:
        category, name = classify_string(value, "site")
        non_cancer |= category == "non_cancer"
        pan_marker |= normalize(value) == "various"
        if category == "tissue" and name:
            site_names.append(name)

    counts = Counter(histology_names)
    competitors = len(histology_names) + morphology_count
    if counts and competitors:
        leader, count = counts.most_common(1)[0]
        tied = len(counts) > 1 and count == counts.most_common(2)[1][1]
        unique_sites = set(site_names)
        if tied and len(unique_sites) == 1:
            code = NAME_TO_CODE[unique_sites.pop()]
            return Subject(
                scope=SubjectScope.SINGLE,
                tissues=[code],
                evidence=[
                    _evidence(
                        record,
                        Confidence.MEDIUM,
                        "A tied histology assignment fell to one repository-stated site.",
                    )
                ],
            )
        if count / competitors >= 2 / 3 and (
            len(counts) == 1 or count > counts.most_common(2)[1][1]
        ):
            code = NAME_TO_CODE[leader]
            return Subject(
                scope=SubjectScope.SINGLE,
                tissues=[code],
                evidence=[
                    _evidence(
                        record,
                        Confidence.HIGH,
                        "A two-thirds histology majority determined the subject.",
                    )
                ],
            )

    chosen_names = set(disease_names or site_names)
    all_names = set(disease_names) | set(site_names)
    if len(all_names) >= PAN_THRESHOLD:
        return Subject(
            scope=SubjectScope.PAN_CANCER,
            evidence=[
                _evidence(
                    record,
                    Confidence.MEDIUM,
                    "Four or more repository-stated tissues make this pan-cancer.",
                )
            ],
        )
    if chosen_names:
        codes = _codes(chosen_names)
        scope = SubjectScope.SINGLE if len(codes) == 1 else SubjectScope.SEVERAL
        return Subject(
            scope=scope,
            tissues=codes,
            evidence=[
                _evidence(
                    record,
                    Confidence.MEDIUM,
                    "Repository disease labels or primary sites mapped to pinned tissues.",
                )
            ],
        )
    if non_cancer:
        return Subject(
            scope=SubjectScope.NON_CANCER,
            evidence=[
                _evidence(
                    record, Confidence.MEDIUM, "The repository filed only non-cancer material."
                )
            ],
        )
    if pan_marker:
        return Subject(
            scope=SubjectScope.PAN_CANCER,
            evidence=[
                _evidence(
                    record,
                    Confidence.MEDIUM,
                    "The repository filed this as mixed or various cancers.",
                )
            ],
        )

    title_codes, title_pan = _title_tissues(record.title)
    if title_codes or title_pan:
        return Subject(
            scope=SubjectScope.TITLE_DERIVED,
            tissues=title_codes,
            evidence=[
                Evidence(
                    method=Method.DERIVED,
                    source_label="Dataset title",
                    locator=f"title: {record.title}",
                    confidence=Confidence.LOW,
                    note="Subject derived from the title because the repository did not state one. It is available for browsing but cannot admit this record to a topic shortlist.",
                )
            ],
        )
    return Subject(
        scope=SubjectScope.NOT_STATED,
        evidence=[_evidence(record, Confidence.LOW, "No controlled subject could be derived.")],
    )


def is_curated(subject: Subject) -> bool:
    return any(e.method == Method.CURATED for e in subject.evidence)


def vocabulary() -> dict[str, Any]:
    return {
        "version": "oncotree_2025_10_03",
        "release_date": "2025-10-03",
        "subjects": [
            {"code": code, **details, "synonyms": SYNONYMS[details["name"]]}
            for code, details in TISSUES.items()
        ],
        "states": [
            scope.value
            for scope in SubjectScope
            if scope not in {SubjectScope.SINGLE, SubjectScope.SEVERAL}
        ],
    }
