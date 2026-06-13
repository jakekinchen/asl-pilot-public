# Dataset Card Template

## dataset subset

- name:
- source:
- license/terms:
- allowed use:
- redistribution status:
- active module:

## provenance

| field | source | allowed in clean lane | notes |
|---|---|---|---|
| raw video | | | |
| gloss label | | | |
| signer id | | | |
| bounding box | | | |
| landmarks | | no by default | quarantined unless manually cleared |

## splits

- train:
- validation:
- test:
- split basis: signer/session/source

## exclusions

- unknown label provenance;
- pretrained-generated labels;
- demographic metadata not needed;
- raw data outside active modules;
- full dataset downloads not required.
