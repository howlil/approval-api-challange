import { Injectable } from "@nestjs/common";
import type { ROLE, User } from "../../../generated/prisma/client"
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id }
        })
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email }
        })
    }


    async create(data: {
        email: string;
        name?: string | null;
        password: string;
        role: ROLE;
    }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name ?? undefined,
                password: data.password,
                role: data.role,
            },
        });
    }
}