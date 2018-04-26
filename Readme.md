
# Requirements Management

This is a tool to help with requirements management for a business.  Where applied, references are taken from `CMMI for Development, Version 1.3`.

## Goals

- REQM SP 1.1 *Understand Requirements*: Develop an understanding with the requirements providers on the meaning of the requirements.
- REQM SP 1.3 *Manage Requirements Changes*: Manage changes to requirements as they evolve during the project.
- REQM SP 1.4 *Maintain Bidirectional Traceability of Requirements*: Maintain bidirectional traceability among requirements and work products.
- REQM SP 1.5 *Ensure Alignment Between Project Work and Requirements*: Ensure that project plans and work products remain aligned with requirements.
- RD SP 3.3 *Analyze Requirements*: Analyze requirements to ensure that they are necessary and sufficient.
- Resolve conflicts between requirements.

## Features

Requirements are structured in a hierarchy.

- *BFFP*: Big Five For Product
- *Claim*: =request. A group of Claims is summarized by a BFFP. (Corresponds loosely to a customer requirement)
- *product requirement*: functions and qualities to be implemented by the product

The tool is implemented as server-software with a webinterface. It is collaborative and enables the organisation and linking of BFFP, Claims, product requirements, use cases, test cases.

## System Overview

Data-model requirement:

- id
- short-name
- description
- comments
- rationale for changes
