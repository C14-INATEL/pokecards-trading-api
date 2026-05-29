## Context

<!-- Why is this change necessary? What problem does it solve or what feature does it add? -->

## Changes

<!-- List the main changes made in this PR. Use objective bullet points. -->

-
-

## Evidence

<!-- Add a Swagger screenshot, test output, or any other proof that the feature works correctly. -->

<details>
<summary>Swagger / Test output</summary>

<!-- Paste the output of `npm run test` or a Swagger screenshot here -->

</details>

## Checklist

### Code
- [ ] PR title follows Conventional Commits (`feat(module): description`)
- [ ] PR covers **1 feature or 1 fix** (no mixed responsibilities)
- [ ] No missing resource returns `null` with `200` — uses `NotFoundException` instead
- [ ] Prisma errors are propagated (no silent catch)

### Endpoints & DTOs
- [ ] Route is plural and kebab-case (e.g. `/trade-proposals`)
- [ ] `CreateDto` has required fields validated with `class-validator`
- [ ] `UpdateDto` has all fields marked `@IsOptional()`
- [ ] `ResponseDto` is documented in Swagger
- [ ] Correct status codes (`201` for POST, `204` for DELETE, `404` for not found)

### Swagger
- [ ] `@ApiTags` on the controller
- [ ] `@ApiOperation` and the appropriate response decorator on each endpoint
- [ ] `@ApiBadRequestResponse` and `@ApiNotFoundResponse` where applicable
- [ ] `@ApiParam` on endpoints with `:id`

### Tests
- [ ] `*.service.spec.ts` uses `InMemoryRepository` (no pure mocks)
- [ ] At least 4 tests per CRUD method (`normal flow` + `extension flow`)
- [ ] Tests `toHaveBeenCalledWith` with the exact structure passed to Prisma
- [ ] Tests `NotFoundException` for non-existent resources
- [ ] `afterEach` calls `inMemoryRepo.clear()` and `jest.clearAllMocks()`

### Review & CI
- [ ] Pipeline is green before requesting review
- [ ] At least 1 review from another team member before merging
