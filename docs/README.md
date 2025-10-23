# Finance Tracker Documentation

This documentation covers the APIs, functions, and components for the Finance Tracker project. It is derived from the current repository context and the product requirements in `README.md`.

Note: At the time of writing, this repository contains only high-level requirements. There is no application source code yet. This documentation defines the intended API, domain model, and component architecture to guide implementation.

## Contents
- Overview
  - Project goals and key features
- Domain model
  - Entities, relationships, and invariants
- API
  - REST conventions and usage
  - OpenAPI reference
- Functions and services
  - Domain services and core computations
- Components
  - Planned UI component architecture
- Examples
  - End-to-end flows and usage recipes

## Quick links
- Overview: `./overview.md`
- Domain model: `./domain-model.md`
- REST API guide: `./api/rest.md`
- OpenAPI spec: `./api/openapi.yaml`
- Functions and services: `./functions.md`
- Components overview: `./components/overview.md`
- Examples:
  - End to end: `./examples/end-to-end.md`
  - Budgets and recurring: `./examples/budgets-and-recurring.md`
  - Debts: `./examples/debts.md`

## How to contribute
- Keep the OpenAPI spec as the source of truth for HTTP interfaces.
- Update `domain-model.md` when introducing or changing entities.
- Co-locate examples with the related feature in `./examples`.
- When UI implementation starts, replace "Planned" sections with concrete component docs and story-style examples.
