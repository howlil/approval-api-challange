import { ConflictException, Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { User } from "../../../generated/prisma/client";
import * as bcrypt from 'bcryptjs';


@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UsersRepository) { }

    async create(data: {
        email: string;
        name?: string | null;
        password: string;
        role: 'CREATOR' | 'APPROVER';
    }): Promise<User> {
        const existing = await this.userRepository.findByEmail(data.email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.userRepository.create({
            email: data.email,
            name: data.name ?? null,
            password: hashedPassword,
            role: data.role,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }
}