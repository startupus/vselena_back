import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех доступных прав' })
  @ApiResponse({ status: 200, description: 'Список прав' })
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Создание нового права' })
  @ApiResponse({ status: 201, description: 'Право создано' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rbacService.createPermission(createPermissionDto);
  }
}
