
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

|Goal|Claim|product requirement|
|-|-|-|
|**Understand Requirements**|*clarify formulation*|functional description of e.g. what the user is expected to do and what he is expected to see on which action
||*keep source of idea*|author and initial description
||*enable discussion*|chat
|||comments on requirements and comments on comments
|**Manage Requirements Changes**|*keep track*|version name, description, rationale
||*park requirements*|secondary requirements hierarchy for review, discussion and filtering
||*unanimity*|change notifications for team members
|||description of change reason
|||comment on change (probably subsumed under normal requirement comment)
|**Bidirectional Traceability**|*notification*|push notifications for elements that are affected by a change of another element
|||show elements that are linked to a specific element
|**Ensure Alignment**|*policy*|policy collection, assign policies to product requirements
||*visualize testing results*|hooks for test-integration tools
|**Analyze Requirements**|*uncover rationale*|field for rationale
||*necessity*|link to parents, optional link label
||*sufficiency*|joint view of all linked children
||*(enable discussion)*
|**Resolve Conflicts**|*find conflicts*|link requirements to components, view of all requirements linked to one component
||*manage conflicts*|mark requirement as conflicting, link conflicting and potentially conflicting (=related?) elements

## System Overview

Data-model requirement:

- id
- short-name
- description
- comments
- rationale for changes
