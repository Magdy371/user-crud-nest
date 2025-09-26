import { Module } from "@nestjs/common";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { PrismaService } from "src/prisma/prisma.service"; 

@Module({
    providers: [ PrismaService, RoleService, ],
    controllers: [ RoleController, ],
    exports: [ RoleService, ],
})
export class RoleModule {}