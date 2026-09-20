# R workbooks

These mirror the six Python workbooks for researchers who work in R and Bioconductor.
They query the same public APIs and need no credentials.
The Python versions are the independently executed reference examples because the build machine
does not have R installed.

The shared notebook contract is documented in [`../manifest.yaml`](../manifest.yaml).
Each entry states the research question, inputs, outputs, steps, runtime, and datasets so an R
implementation can be compared with the Python implementation without guessing what the example
is meant to prove.

The six examples cover:

- capability screening before access;
- survival derivation and modelling;
- treatment-response validation;
- scarce-modality discovery;
- cross-repository patient linkage; and
- agent-style dataset selection.

The site shows the executed Python notebooks and their figure previews at `/notebooks`.
R workbooks become part of that gallery only after they have an execution receipt and output hash.

## Execution status: NOT independently executed

The six workbooks counted as "independently executed" in this project are the Python ones in
`../python/`, each with a receipt in `../executed/`. The R workbooks here are **written but not
executed in our environment**, and we label them as such rather than implying otherwise.

The reason is mundane: R is not installed on the build machine, and `brew install r` exits
successfully without installing anything because `/opt/homebrew` has ownership problems that
require `sudo chown -R "$(whoami)" /opt/homebrew`. We did not make that change to someone
else's machine without being asked.

To run them:

```bash
sudo chown -R "$(whoami)" /opt/homebrew    # only if brew reports ownership problems
brew install r
Rscript -e 'install.packages(c("httr2","jsonlite","survival","data.table"), repos="https://cloud.r-project.org")'
Rscript 01_can_i_answer_this.R
Rscript 02_survival_tcga_brca.R
```

Once R is available, `cds workbooks` can be extended to execute and receipt these the same way
it does the Python ones.
