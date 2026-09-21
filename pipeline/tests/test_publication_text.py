"""A publication's title is text, never the typesetting a bibliographic API holds.

Europe PMC returns titles with their inline markup escaped, so a record can carry
`&lt;i&gt;in vitro&lt;/i&gt;`. Every surface that shows a reuse study - the dataset page,
the funding graph, the JSON-LD description, the agent package - prints whatever the
field holds, so the entities were reaching readers verbatim.

Fixed on the model so that loading the enriched store repairs it too, and these tests
pin both halves of that: the cleaning rule, and the fact that it runs on load.
"""

from __future__ import annotations

import pytest

from cds.model import Publication, clean_text


@pytest.mark.parametrize(
    ("raw", "want"),
    [
        # What the corpus actually held.
        (
            "Oncolytic herpes simplex virus infects myeloma cells "
            "&lt;i&gt;in\xa0vitro&lt;/i&gt; and &lt;i&gt;in\xa0vivo&lt;/i&gt;.",
            "Oncolytic herpes simplex virus infects myeloma cells in vitro and in vivo.",
        ),
        ("CD8&lt;sup&gt;+&lt;/sup&gt; T cells", "CD8+ T cells"),
        ("H&amp;E histopathology", "H&E histopathology"),
        # Already unescaped markup, which some sources send instead.
        ("<i>BRCA1</i> and <sub>2</sub>", "BRCA1 and 2"),
        # A mathematical comparison is prose, not a tag, and survives intact.
        ("Survival at temperature &lt; 37 degrees", "Survival at temperature < 37 degrees"),
        ("Tumours &gt; 2 cm", "Tumours > 2 cm"),
        # Non-breaking and thin spaces defeat wrapping in a narrow column.
        ("Growth in\xa0vitro and beyond", "Growth in vitro and beyond"),
        ("  padded   and  doubled  ", "padded and doubled"),
    ],
)
def test_clean_text(raw: str, want: str) -> None:
    assert clean_text(raw) == want


@pytest.mark.parametrize("empty", [None, "", "   ", "&lt;i&gt;&lt;/i&gt;"])
def test_nothing_in_nothing_out(empty: str | None) -> None:
    """A title that was only markup is absent, not an empty string pretending to be one."""
    assert not clean_text(empty)


def test_the_model_cleans_on_construction_and_on_load() -> None:
    dirty = "A study of &lt;i&gt;TP53&lt;/i&gt;"
    clean = "A study of TP53"

    assert Publication(title=dirty).title == clean
    assert Publication(journal=dirty).journal == clean

    # The enriched store is deserialized through the model, which is why no re-fetch
    # from Europe PMC was needed to clear the corpus.
    assert Publication.model_validate({"title": dirty}).title == clean


def test_only_typesetting_is_unwrapped() -> None:
    """An unknown tag is left alone rather than silently deleted.

    Dropping anything angle-bracketed would quietly edit a title whose author wrote one,
    and a wrong title is worse than an ugly one.
    """
    assert clean_text("A gene named &lt;unknown&gt; here") == "A gene named <unknown> here"


@pytest.mark.parametrize(
    ("raw", "want"),
    [
        # `html.unescape` resolves these legacy unterminated references; an author writing
        # "&not" before a word is far likelier than a title meaning the negation sign.
        ("Notch signalling &notable in glioma", "Notch signalling &notable in glioma"),
        ("Cohorts &amped by selection bias", "Cohorts &amped by selection bias"),
        ("A &ltd trial arm", "A &ltd trial arm"),
        ("AT&T Labs and R&D spending", "AT&T Labs and R&D spending"),
        # Terminated references are still decoded, including the numeric forms.
        ("Tumour &amp; stroma", "Tumour & stroma"),
        ("5 &#8211; 10 cases", "5 – 10 cases"),
        ("&#x3b2;-catenin signalling", "β-catenin signalling"),
    ],
)
def test_only_complete_entities_are_decoded(raw: str, want: str) -> None:
    """A bare ampersand is the author's, not markup.

    The decoder Python ships accepts a character reference with no closing semicolon, so
    "signalling &notable" came back as "signalling ¬table" - the exact silent edit the
    tag rule above is written to avoid, arriving through the other half of the function.
    """
    assert clean_text(raw) == want
