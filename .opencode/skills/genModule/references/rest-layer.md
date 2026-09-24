# REST Layer Implementation

REST APIs for external integrations (mobile apps, third-party services).

**Note:** Admin dashboard uses tRPC directly. REST is optional unless needed for external clients.

## Controller Template

**Location:** `apps/api/src/modules/[module]/rest/[module].controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { [Module]Service } from "../services/[module].service";
import { Create[Module]Dto, Update[Module]Dto } from "../dtos/[module].dto";
import { JwtAuthGuard } from "../../core/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../core/guards/permissions.guard";
import { RequirePermissions } from "../../core/decorators/permissions.decorator";

@ApiTags("[Module_plural]")
@Controller("[module_plural]")
export class [Module]Controller {
  constructor(private readonly [module]Service: [Module]Service) {}

  @Get()
  @ApiOperation({ summary: "List all [module_plural]" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "Returns paginated list" })
  findAll(@Query() query: any) {
    return this.[module]Service.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get [module] by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "[Module] found" })
  @ApiResponse({ status: 404, description: "[Module] not found" })
  findOne(@Param("id") id: string) {
    return this.[module]Service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("[module]:create")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new [module]" })
  @ApiResponse({ status: 201, description: "[Module] created" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createDto: Create[Module]Dto) {
    return this.[module]Service.create(createDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("[module]:update")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update [module]" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "[Module] updated" })
  @ApiResponse({ status: 404, description: "[Module] not found" })
  update(@Param("id") id: string, @Body() updateDto: Update[Module]Dto) {
    return this.[module]Service.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("[module]:delete")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete [module]" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 204, description: "[Module] deleted" })
  @ApiResponse({ status: 404, description: "[Module] not found" })
  delete(@Param("id") id: string) {
    return this.[module]Service.delete(id);
  }
}
```

## Service Template

**Location:** `apps/api/src/modules/[module]/services/[module].service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma.service";
import { Create[Module]Dto, Update[Module]Dto } from "../dtos/[module].dto";

@Injectable()
export class [Module]Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 10, search, ...filters } = query;

    const where: any = {};

    // Search logic
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        where[key] = value;
      }
    });

    const [items, total] = await Promise.all([
      this.prisma.[module].findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.[module].count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.[module].findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`[Module] with ID ${id} not found`);
    }

    return item;
  }

  async create(createDto: Create[Module]Dto) {
    // Validation
    if (createDto.email) {
      const existing = await this.prisma.[module].findUnique({
        where: { email: createDto.email },
      });

      if (existing) {
        throw new BadRequestException("Email already exists");
      }
    }

    return this.prisma.[module].create({
      data: createDto,
    });
  }

  async update(id: string, updateDto: Update[Module]Dto) {
    // Check existence
    await this.findOne(id);

    return this.prisma.[module].update({
      where: { id },
      data: updateDto,
    });
  }

  async delete(id: string) {
    // Check existence
    await this.findOne(id);

    return this.prisma.[module].delete({
      where: { id },
    });
  }
}
```

## DTOs Template

**Location:** `apps/api/src/modules/[module]/dtos/[module].dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEmail, IsNumber, IsBoolean, IsEnum, Min, IsDateString } from "class-validator";

export class Create[Module]Dto {
  @ApiProperty({ example: "Example [module]" })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "active", enum: ["active", "inactive"] })
  @IsOptional()
  @IsEnum(["active", "inactive"])
  status?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class Update[Module]Dto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "active", enum: ["active", "inactive"] })
  @IsOptional()
  @IsEnum(["active", "inactive"])
  status?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

## Module Registration

**Location:** `apps/api/src/modules/[module]/[module].module.ts`

```typescript
import { Module } from "@nestjs/common";
import { [Module]Controller } from "./rest/[module].controller";
import { [Module]Service } from "./services/[module].service";
import { PrismaModule } from "../../../prisma.service";

@Module({
  imports: [PrismaModule],
  controllers: [[Module]Controller],
  providers: [[Module]Service],
  exports: [[Module]Service],
})
export class [Module]Module {}
```

**Register in app.module.ts:**

```typescript
import { [Module]Module } from "./modules/[module]/[module].module";

@Module({
  imports: [
    // ... other modules
    [Module]Module,
  ],
})
export class AppModule {}
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "Example",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### List Response (200)

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "[Module] not found",
    "details": {}
  }
}
```

## Testing Endpoints

```bash
# List
curl http://localhost:3000/api/v1/[module_plural]?page=1&limit=10

# Get by ID
curl http://localhost:3000/api/v1/[module_plural]/clx123...

# Create (with auth)
curl -X POST http://localhost:3000/api/v1/[module_plural] \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Example","status":"active"}'

# Update (with auth)
curl -X PUT http://localhost:3000/api/v1/[module_plural]/clx123... \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated"}'

# Delete (with auth)
curl -X DELETE http://localhost:3000/api/v1/[module_plural]/clx123... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Swagger Documentation

Access at: `http://localhost:3000/api/docs`

Add detailed documentation using decorators:

```typescript
@ApiOperation({
  summary: "Create [module]",
  description: "Creates a new [module] with the provided data"
})
@ApiResponse({
  status: 201,
  description: "Successfully created",
  schema: {
    example: {
      id: "clx123...",
      name: "Example",
      createdAt: "2024-01-01T00:00:00Z"
    }
  }
})
@ApiResponse({
  status: 400,
  description: "Invalid input data"
})
create(@Body() createDto: Create[Module]Dto) {
  return this.[module]Service.create(createDto);
}
```
