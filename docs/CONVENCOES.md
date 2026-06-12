# Convenções do Projeto — Pokecards Trading API

Padrões para endpoints, testes, branches e commits.
Cumprir essas convenções facilita a revisão de PR, a apresentação do projeto e a cobertura de testes.

---

## 1. Endpoints

### 1.1 Nome dos recursos

- Sempre **plural** em **kebab-case**: `/wishlists`, `/trades`, `/trade-proposals`
- Sem prefixo `/api/...`
- Identificadores via path param: `/wishlists/:id` (UUID v4)

### 1.2 Métodos e status codes

| Operação | Verbo | Path | Sucesso | Erros |
|----------|-------|------|---------|-------|
| Criar | `POST` | `/<recurso>` | `201 Created` | `400 Bad Request` |
| Listar | `GET` | `/<recurso>` | `200 OK` (array, vazio se nada) | — |
| Buscar por id | `GET` | `/<recurso>/:id` | `200 OK` | `404 Not Found` |
| Atualizar | `PATCH` | `/<recurso>/:id` | `200 OK` | `400`, `404` |
| Remover | `DELETE` | `/<recurso>/:id` | `204 No Content` | `404 Not Found` |

> Regra inviolável: **nunca** retornar `null` com status `200`. Recurso não encontrado → `throw new NotFoundException(...)`.

### 1.3 DTOs

Cada módulo tem três DTOs principais:

| DTO | Para que serve | Validação |
|-----|----------------|-----------|
| `Create<X>Dto` | Payload de `POST` | Campos obrigatórios marcados |
| `Update<X>Dto` | Payload de `PATCH` | Todos os campos `@IsOptional()` |
| `<X>ResponseDto` | Formato da resposta | Documentado no Swagger |

DTOs auxiliares (itens, cartas) ficam em arquivos separados quando reutilizáveis.

Validação obrigatória via `class-validator`:

```typescript
@IsString()        @IsNotEmpty()
@IsUUID('4')       @IsInt()  @Min(1)
@IsArray()         @ValidateNested({ each: true })  @Type(() => ItemDto)
@IsOptional()      @IsEnum(MyEnum)
```

### 1.4 Swagger (obrigatório)

Decoradores mínimos por endpoint:

```typescript
@ApiTags('Recursos')                                           // no controller
@ApiOperation({ summary: '...' })
@ApiCreatedResponse({ description: '...', type: ResponseDto }) // POST
@ApiOkResponse({ description: '...', type: ResponseDto })      // GET / PATCH
@ApiNoContentResponse({ description: '...' })                  // DELETE
@ApiBadRequestResponse({ description: '...', type: ValidationErrorResponseDto })
@ApiNotFoundResponse({ description: '...', type: NotFoundResponseDto })
@ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
```

### 1.5 Tratamento de erro

- Recurso ausente → `throw new NotFoundException('<Recurso> com id "<id>" não encontrado')`
- Validação de payload → tratada automaticamente pelo `ValidationPipe` global
- Erros do Prisma → propagados (sem captura silenciosa)

### 1.6 Template de Controller

```typescript
@ApiTags('Recursos')
@Controller('recursos')
export class RecursoController {
  constructor(private readonly service: RecursoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um recurso' })
  @ApiCreatedResponse({ description: 'Recurso criado com sucesso.', type: RecursoResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ValidationErrorResponseDto })
  create(@Body() dto: CreateRecursoDto): Promise<RecursoResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recursos' })
  @ApiOkResponse({ description: 'Lista de recursos.', type: [RecursoResponseDto] })
  findAll(): Promise<RecursoResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar recurso por id' })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ description: 'Recurso encontrado.', type: RecursoResponseDto })
  @ApiNotFoundResponse({ description: 'Recurso não encontrado.', type: NotFoundResponseDto })
  findOne(@Param('id') id: string): Promise<RecursoResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar recurso' })
  @ApiOkResponse({ description: 'Recurso atualizado.', type: RecursoResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ValidationErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Recurso não encontrado.', type: NotFoundResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateRecursoDto): Promise<RecursoResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover recurso' })
  @ApiNoContentResponse({ description: 'Recurso removido.' })
  @ApiNotFoundResponse({ description: 'Recurso não encontrado.', type: NotFoundResponseDto })
  delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }
}
```

---

## 2. Testes unitários

### 2.1 Padrão único: `InMemoryRepository`

- Cada `<modulo>.service.spec.ts` define uma classe `InMemory<X>Repository` que simula em memória os métodos do Prisma usados pelo service.
- `PrismaService` é injetado via `useValue` com `jest.fn().mockImplementation(...)` delegando para a `InMemoryRepository`.
- **Nada de blocos paralelos "mock puro"** — o `InMemoryRepository` já cobre `toHaveBeenCalledWith` e propagação de erros.

### 2.2 Estrutura do arquivo spec

```
1. Imports
   - Test, TestingModule (@nestjs/testing)
   - NotFoundException (@nestjs/common)
   - Service, PrismaService, DTOs, tipos do Prisma

2. Tipos auxiliares
   - <X>Data, <X>Input

3. Classe InMemory<X>Repository
   - Implementa apenas os métodos do Prisma que o service usa
   - Sempre tem clear() para resetar estado entre testes

4. describe('<X>Service') {
     let service, inMemoryRepo, prismaServiceMock;

     beforeEach: monta TestingModule, instancia repo, fia mocks
     afterEach:  inMemoryRepo.clear() + jest.clearAllMocks()

     describe('create')  { describe('fluxo normal'){...}; describe('fluxo de extensão'){...} }
     describe('findOne') { idem }
     describe('findAll') { idem }
     describe('update')  { idem }
     describe('delete')  { idem }
   }
```

### 2.3 Convenções de nomes

- Nome do método em **inglês** no `describe` externo: `'create'`, `'findOne'`, `'findAll'`, `'update'`, `'delete'`.
- Sub-`describe` em **português**: `'fluxo normal'` e `'fluxo de extensão'`.
- Mensagens do `it` em **inglês** com prefixo `'should ...'`.

### 2.4 Cobertura mínima

| Bloco | Mínimo de testes | O que cobrir |
|-------|------------------|--------------|
| `fluxo normal` | 2 | Resultado retornado, propriedades preservadas, valores default |
| `fluxo de extensão` | 2 | `toHaveBeenCalledWith`, call count, `NotFoundException`, propagação de erros do Prisma |

Total **mínimo de 4 testes por método CRUD**.

### 2.5 Padrão de assertions

**Fluxo normal:**

```typescript
it('should create a recurso with provided data', async () => {
  const dto: CreateRecursoDto = { /* ... */ };

  const result = await service.create(dto);

  expect(result).toBeDefined();
  expect(result.id).toBeDefined();
  expect(result.someField).toBe(dto.someField);
});
```

**Fluxo de extensão — call args:**

```typescript
it('should call prisma.recurso.create with correct structure', async () => {
  const dto: CreateRecursoDto = { /* ... */ };

  await service.create(dto);

  expect(prismaServiceMock.recurso.create).toHaveBeenCalledTimes(1);
  expect(prismaServiceMock.recurso.create).toHaveBeenCalledWith({
    data: { /* ... */ },
    include: { /* ... */ },
  });
});
```

**Fluxo de extensão — NotFound:**

```typescript
it('should throw NotFoundException when recurso does not exist', async () => {
  await expect(service.findOne('id-inexistente')).rejects.toThrow(NotFoundException);
});

it('should not call prisma.recurso.update when recurso does not exist', async () => {
  await service.update('id-inexistente', dto).catch(() => {});
  expect(prismaServiceMock.recurso.update).not.toHaveBeenCalled();
});
```

### 2.6 Setup canônico

```typescript
describe('RecursoService', () => {
  let service: RecursoService;
  let inMemoryRepo: InMemoryRecursoRepository;
  let prismaServiceMock: {
    recurso: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    inMemoryRepo = new InMemoryRecursoRepository();

    prismaServiceMock = {
      recurso: {
        create:     jest.fn().mockImplementation((args) => inMemoryRepo.create(args)),
        findUnique: jest.fn().mockImplementation((args) => inMemoryRepo.findUnique(args)),
        findMany:   jest.fn().mockImplementation((args) => inMemoryRepo.findMany(args)),
        update:     jest.fn().mockImplementation((args) => inMemoryRepo.update(args)),
        delete:     jest.fn().mockImplementation((args) => inMemoryRepo.delete(args)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecursoService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<RecursoService>(RecursoService);
  });

  afterEach(() => {
    inMemoryRepo.clear();
    jest.clearAllMocks();
  });

  // describes por método...
});
```

### 2.7 Boas práticas

- **Um teste, um comportamento.** Não testar dois caminhos diferentes no mesmo `it()`.
- **Mensagens descrevem comportamento**, não implementação. Boa: `should throw NotFoundException when wishlist does not exist`. Ruim: `should call findUnique then throw`.
- **Evitar cadeia `create` → assertion sobre `findOne`** quando o teste é sobre `findOne` puro. Use estado direto do `InMemoryRepository` quando possível.
- **Não misturar mock puro com InMemory** no mesmo arquivo.
- Quando o método não recebe argumentos relevantes para validação de input, ainda assim testar `toHaveBeenCalledTimes(1)` e o `where`/`include` repassados ao Prisma.

---

## 3. Branches e commits

### 3.1 Branches

| Prefixo | Uso |
|---------|-----|
| `feat/<nome>` | Nova funcionalidade |
| `fix/<nome>` | Correção de bug |
| `refactor/<nome>` | Refactor sem mudança de comportamento |
| `test/<nome>` | Adicionar/ajustar testes |
| `docs/<nome>` | Mudanças só de documentação |
| `chore/<nome>` | Tarefas auxiliares (deps, config) |

Nomes em kebab-case e descritivos: `feat/trade-update-and-delete`, não `feat/trade-coisas`.

### 3.2 Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(trades): add update and delete endpoints
fix(wishlist): findOne now throws NotFoundException
test(trade-proposal): standardize describe structure
refactor(wishlist): remove mock puro blocks
docs: add user stories
chore(ci): migrate pipeline to gitlab-ci
```

Evitar: `wip`, `update`, `already done`, `hotfix` solto. Se for hotfix, é `fix(<modulo>): ...`.

### 3.3 Pull Requests

| Item | Regra |
|------|-------|
| Título | Mesmo padrão dos commits (Conventional Commits) |
| Descrição | Contexto + mudanças + evidência (screenshot do Swagger, output de teste) + checklist |
| Review | Pelo menos 1 review de outro integrante antes do merge |
| CI | Não fazer merge com pipeline vermelho |
| Tamanho | Preferir PRs menores (1 feature ou 1 fix por PR) |
