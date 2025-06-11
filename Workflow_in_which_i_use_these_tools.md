# Bandar Admin Frontend: Module Development & Maintenance Workflow

This document outlines the MANDATORY, standardized, and checkpoint-driven workflow for creating new frontend modules or significantly modifying existing ones in the Bandar Admin Frontend project. Adherence to this workflow is critical for consistency, quality, and enabling autonomous agent operation.

**Core Principles:**
-   **Scratchpad Driven**: ALL module development work MUST be tracked in a dedicated scratchpad file (e.g., `cascade-scratchpad-[module-name]-development.md`). This file will follow the checkpoint structure outlined below.
-   **Tiered Approach**: The level of detail for each checkpoint will vary based on module complexity:
    -   **Tier 1: Simple Entity Modules** (e.g., Role Management, Activity Category)
    -   **Tier 2: Composite Modules** (Containers for sub-modules, e.g., Activity Management -> activity-management/category/list, activity-management/hashtag/list)
    -   **Tier 3: Complex Entity Modules/Views** (e.g., A single Activity's detailed tabbed view with packages, addOns)
-   **Memory Adherence**: Strictly follow guidelines documented in project memories (e.g., File and Folder Naming Conventions (ID: 21d8b3f8-b375-4f59-8e1b-16959263c17e), API Naming Conventions (ID: f818edbb-058e-49b7-ac4b-b1148b4a6a03), API Hooks Usage Guide (ID: 3ab4b740-3759-46db-9d34-4d80db4f2536), Role-Based Permissions Management (ID: 18639cff-290f-4237-973e-5a547629b354), Routing, Navigation, and Sidebar Configuration (ID: 4fec179a-902f-4d94-be4a-c9c529b94ece), Page and Section Component Structure (ID: b92da2c1-20b4-4e46-bb04-474bb34ad813)).
-   **Tool Usage**: Leverage GOD MODE tools (`searchApiDocs`, `getAccessToken`, `analyzeApiCalls`) and `context7` as specified.

---

## Generalized Enhanced GOD MODE Workflow for Module Design & Implementation

*(This section is adapted from [cascade-scratchpad-complex-entity-view-analysis.md](cci:7://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/cascade-scratchpad-complex-entity-view-analysis.md:0:0-0:0))*

**Phase 1: Discovery & Data Modeling (Foundation Laying)**

1.  **Define Scope & Objectives (Scratchpad: Checkpoint 1.1 - Initial Setup)**
    *   **Action**: Create/Update the scratchpad. Articulate the module's purpose, target user actions, and boundaries. Define its Tier.
    *   **Scratchpad Entry**:
        *   `## Module/Feature: [Module Name & Tier]`
        *   `## Objectives: (List specific goals)`
        *   `## Key Entities Involved: (List entities)`
        *   `## High-Level Requirements: (List key functionalities)`
        *   `## Relevant Memories: (List specific IDs, e.g., File/Folder Naming: 21d8b3f8-b375-4f59-8e1b-16959263c17e, API Naming: f818edbb-058e-49b7-ac4b-b1148b4a6a03, API Hooks: 3ab4b740-3759-46db-9d34-4d80db4f2536, Permissions: 18639cff-290f-4237-973e-5a547629b354, Routing: 4fec179a-902f-4d94-be4a-c9c529b94ece, Page/Section Structure: b92da2c1-20b4-4e46-bb04-474bb34ad813)`

2.  **API Exploration & Documentation (`searchApiDocs`) (Scratchpad: Checkpoint 1.2 - API Map)**
    *   **Action**: Use `mcp0_searchApiDocs` for all relevant entities. Document findings meticulously in the scratchpad.
    *   **Scratchpad Entry (Dedicated Section)**:
        *   `## API Endpoint Analysis (from searchApiDocs)`
        *   [(Document each relevant endpoint group: Purpose, Request Params/Body, Response Keys, Relationships, Ambiguities)](cci:1://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/App.tsx:20:0-43:1)
    *   **Note**: Refer to `route.ts` for existing API URL patterns if modifying a module.

3.  **Define TypeScript Interfaces & Transformation Logic (Scratchpad: Checkpoint 1.3 - Data Contracts)**
    *   **Action**: Based on API Map, draft interfaces (in [types.ts](cci:7://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/api/activity-management/category/types.ts:0:0-0:0) file within the module's `api` folder) and identify transformations (in `transform.ts`). Adhere to **API Naming Conventions (Memory ID: f818edbb-058e-49b7-ac4b-b1148b4a6a03)**.
    *   **Scratchpad Entry**:
        *   `## TypeScript Interface & Transformation Plan`
        *   [(List key interfaces and transformation needs, noting file paths)](cci:1://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/App.tsx:20:0-43:1)

4.  **(Optional) API Behavior Validation (Scratchpad: Checkpoint 1.4 - API Behavior Validation)**
    *   **Action**: For complex/ambiguous APIs, use `executeAuthenticatedApiCall` tool to test discovered endpoints with real authentication and validate actual response structures.
    *   **New Unified Approach**: Instead of manual token retrieval + curl commands:
        *   Configure environment variables once: `AUTH_ORIGIN`, `AUTH_STORAGE_TYPE`, `AUTH_TOKEN_KEY`, `API_BASE_URL`
        *   Use `executeAuthenticatedApiCall` with endpoint path to get real response data
        *   Use `analyzeApiCalls` if network debugging is needed
    *   **Legacy Note**: Previously used `getAccessToken` + manual CURL - now automated for better reliability
    *   **Scratchpad Entry**:
        *   `## API Behavior Validation (from executeAuthenticatedApiCall)`

**Phase 2: Frontend Architecture & Design**

5.  **Plan API Hooks (TanStack Query) (Scratchpad: Checkpoint 2.1 - Data Access Layer Plan)**
    *   **Action**: Design TanStack Query hooks (in [api.ts](cci:7://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/api/activity-management/category/api.ts:0:0-0:0) file within the module's `api` folder). Adhere to **API Hooks Usage Guide (Memory ID: 3ab4b740-3759-46db-9d34-4d80db4f2536)** and **API Naming Conventions (Memory ID: f818edbb-058e-49b7-ac4b-b1148b4a6a03)**.
    *   **Scratchpad Entry**:
        *   `## TanStack Query Hooks Plan`
        *   [(List planned query and mutation hooks, purpose, query keys, and key invalidation strategies)](cci:1://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/App.tsx:20:0-43:1)

6.  **Outline Component Structure (Page & Sections) (Scratchpad: Checkpoint 2.2 - UI Blueprint)**
    *   **Action**: Plan component hierarchy (Page components in `src/pages/...`, Section components in `src/sections/...`). Adhere to **File and Folder Naming Conventions (Memory ID: 21d8b3f8-b375-4f59-8e1b-16959263c17e)** and **Page and Section Component Structure (Memory ID: b92da2c1-20b4-4e46-bb04-474bb34ad813)**.
    *   **Scratchpad Entry**:
        *   `## Component Structure Plan`
        *   [(Detail Page components, main Section components, significant children. Specify responsibilities and file paths.)](cci:1://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/App.tsx:20:0-43:1)

7.  **Plan Routing, Navigation, and Permissions (Scratchpad: Checkpoint 2.3 - Integration Plan)**
    *   **Action**: Define paths, route configurations, sidebar entries, and permission requirements. Adhere to **Routing, Navigation, and Sidebar Configuration (Memory ID: 4fec179a-902f-4d94-be4a-c9c529b94ece)** and **Role-Based Permissions Management (Memory ID: 18639cff-290f-4237-973e-5a547629b354)**.
    *   **Scratchpad Entry**:
        *   `## Integration Plan`
        *   `Paths (in paths.ts): ...`
        *   `Route Definitions (in modules.tsx): ... (including lazy loading and PermissionGuard)`
        *   `Sidebar Config (in config-navigation.tsx): ... (including moduleKey and requiredPermissionLevel)`
        *   `Permission Module Keys to be used: ...`

**Phase 3: Implementation & Iteration**

8.  **Iterative Development & Refinement (Scratchpad: Checkpoint 3.x - Implementation Log)**
    *   **Action**: Implement the module based on the plans.
        *   **UI Components**: Use Material UI ([MUI components](https://mui.com/material-ui/all-components/)) or existing common components.
        *   **Forms**: Use Yup for validation.
        *   **Code Style**: When modifying existing code, comment out old code instead of deleting it.
        *   **Documentation**: Use `mcp1_get-library-docs` (via `context7`) for external library documentation if needed.
        *   **Toasts**: Use our perdefined toaster in `toast.ts` file for providing user-feedback.
    *   **Scratchpad Entry (Ongoing)**:
        *   `## Implementation Log`
        *   `Date: [YYYY-MM-DD] - Checkpoint 3.x: [Description of work, decisions, files created/modified, issues resolved]`

**Phase 4: Review & Finalization**

9.  **Review & Finalization (Scratchpad: Checkpoint 4.1 - Final Review & TODOs)**
    *   **Action**: Review against objectives, functionality, quality standards, and all relevant memories.
    *   **Scratchpad Entry**:
        *   `## Final Review & TODOs`
        *   [(Functionality Checklist, Code Review Notes, Performance Observations, Future Enhancements, Confirmation of memory adherence)](cci:1://file:///home/meet/Desktop/Bandar/Bandar-Admin-Frontend/src/App.tsx:20:0-43:1)

---

## General Development Guidelines (Always Applicable)

-   **Package Manager**: Use `pnpm`.
-   **Local Environment**: Ensure localhost is running on port 5173.
-   **Version Control**: Follow project's Git workflow (commit conventions, branching strategy).
-   **Code Comments**: Add comments for complex logic or non-obvious decisions.
-   **Error Handling**: Implement robust error handling and user feedback (e.g., toasts).
-   **Testing**: (Specify project's testing strategy if defined, e.g., unit tests, integration tests).