import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { HibpService } from '../common/hibp/hibp.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private hibp: HibpService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUserByEmail = await (this.prisma as any).users.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUserByUsername = await (this.prisma as any).users.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Verify role exists
    const role = await (this.prisma as any).roles.findUnique({
      where: { id: createUserDto.role_id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check password against known data breaches (HIBP k-anonymity API)
    if (createUserDto.password) {
      await this.hibp.assertNotPwned(createUserDto.password);
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (createUserDto.password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
    }

    // Create user
    try {
      const user = await (this.prisma as any).users.create({
        data: {
          email: createUserDto.email,
          username: createUserDto.username,
          password: hashedPassword,
          role_id: createUserDto.role_id,
          first_name: createUserDto.first_name,
          last_name: createUserDto.last_name,
          is_active: createUserDto.is_active ?? true,
        },
        include: {
          roles: true,
        },
      });

      // Remove password and internal fields from response
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch {
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(search?: string, hasInventory?: boolean, pendingOrdersOnly?: boolean) {
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasInventory) {
      where.singles = { some: {} };
    }

    if (pendingOrdersOnly) {
      // Find users who have AT LEAST ONE order that is NOT COMPLETED or CANCELLED
      where.orders = {
        some: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED'],
          },
        },
      };
    }

    const users = await (this.prisma as any).users.findMany({
      where,
      include: {
        roles: true,
      },
    });

    // Remove passwords and internal fields from response
    return users.map(({ password: _, ...userWithoutPassword }) => userWithoutPassword);
  }

  async findOne(id: string) {
    const user = await (this.prisma as any).users.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password and internal fields from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    const user = await (this.prisma as any).users.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      is_active: user.is_active,
      is_hydra_alias: user.is_hydra_alias ?? false,
      store_name: user.store_name,
      rfc: user.rfc,
      store_logo_url: user.store_logo_url,
      role: {
        id: user.roles.id,
        name: user.roles.name,
        display_name: user.roles.display_name,
      },
      avatar_url: user.avatar_url,
    };
  }

  async findById(id: string) {
    const user = await (this.prisma as any).users.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return null;
    }

    // Return user in format expected by JWT strategy
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      is_active: user.is_active,
      is_hydra_alias: user.is_hydra_alias ?? false,
      store_name: user.store_name,
      rfc: user.rfc,
      store_logo_url: user.store_logo_url,
      role: {
        id: user.roles.id,
        name: user.roles.name,
        display_name: user.roles.display_name,
      },
      avatar_url: user.avatar_url,
    };
  }

  async signup(signupDto: SignupDto) {
    // Check if email already exists
    const existingUserByEmail = await (this.prisma as any).users.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUserByUsername = await (this.prisma as any).users.findUnique({
      where: { username: signupDto.username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Find CLIENT role
    const clientRole = await (this.prisma as any).roles.findFirst({
      where: { name: 'CLIENT' },
    });

    if (!clientRole) {
      throw new NotFoundException('CLIENT role not found. Please seed the database.');
    }

    // Check password against known data breaches (HIBP k-anonymity API)
    await this.hibp.assertNotPwned(signupDto.password);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    // Create user with CLIENT role
    try {
      const user = await (this.prisma as any).users.create({
        data: {
          email: signupDto.email,
          username: signupDto.username,
          password: hashedPassword,
          role_id: clientRole.id,
          first_name: signupDto.first_name,
          last_name: signupDto.last_name,
          is_active: true, // New signups are active by default
        },
        include: {
          roles: true,
        },
      });

      // Remove password and internal fields from response
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch {
      throw new BadRequestException('Failed to create user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const user = await (this.prisma as any).users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If email is being updated, check for conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserByEmail = await (this.prisma as any).users.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // If username is being updated, check for conflicts
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUserByUsername = await (this.prisma as any).users.findUnique({
        where: { username: updateUserDto.username },
      });

      if (existingUserByUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    // If role is being updated, verify it exists
    if (updateUserDto.role_id) {
      const role = await (this.prisma as any).roles.findUnique({
        where: { id: updateUserDto.role_id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    try {
      const updatedUser = await (this.prisma as any).users.update({
        where: { id },
        data: {
          ...(updateUserDto.email && { email: updateUserDto.email }),
          ...(updateUserDto.username && { username: updateUserDto.username }),
          ...(updateUserDto.role_id && { role_id: updateUserDto.role_id }),
          ...(updateUserDto.first_name !== undefined && {
            first_name: updateUserDto.first_name,
          }),
          ...(updateUserDto.last_name !== undefined && {
            last_name: updateUserDto.last_name,
          }),
          ...(updateUserDto.is_active !== undefined && {
            is_active: updateUserDto.is_active,
          }),
        },
        include: {
          roles: true,
        },
      });

      // Remove password and internal fields from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch {
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: string) {
    // Check if user exists
    const user = await (this.prisma as any).users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      // Delete all related records in a transaction
      await (this.prisma as any).$transaction(async (tx) => {
        // Delete wallet transactions
        await tx.wallet_transactions.deleteMany({ where: { user_id: id } });

        // Delete cart items (via cart)
        const cart = await tx.carts.findUnique({ where: { user_id: id } });
        if (cart) {
          await tx.cart_items.deleteMany({ where: { cart_id: cart.id } });
          await tx.carts.delete({ where: { id: cart.id } });
        }

        // Delete order-related records
        const orders = await tx.orders.findMany({
          where: { user_id: id },
          select: { id: true },
        });
        const orderIds = orders.map((o) => o.id);

        if (orderIds.length > 0) {
          await tx.payments.deleteMany({ where: { order_id: { in: orderIds } } });
          await tx.order_shipping.deleteMany({ where: { order_id: { in: orderIds } } });
          await tx.order_items_importation.deleteMany({ where: { order_id: { in: orderIds } } });
          await tx.order_items.deleteMany({ where: { order_id: { in: orderIds } } });
          await tx.orders.deleteMany({ where: { user_id: id } });
        }

        // Delete listings
        await tx.listings.deleteMany({ where: { user_id: id } });

        // Delete owned singles and their dependencies
        const ownedSingles = await tx.singles.findMany({
          where: { owner_id: id },
          select: { id: true },
        });
        const singleIds = ownedSingles.map((s) => s.id);

        if (singleIds.length > 0) {
          // Remove references from other users' cart items and order items
          await tx.cart_items.deleteMany({ where: { single_id: { in: singleIds } } });
          await tx.order_items.deleteMany({ where: { single_id: { in: singleIds } } });
          await tx.listings.deleteMany({ where: { single_id: { in: singleIds } } });
          await tx.single_tags.deleteMany({ where: { single_id: { in: singleIds } } });
          await tx.singles.deleteMany({ where: { owner_id: id } });
        }

        // Delete order_shipping that references user addresses (must be before addresses)
        const addresses = await tx.user_addresses.findMany({
          where: { user_id: id },
          select: { id: true },
        });
        const addressIds = addresses.map((a) => a.id);
        if (addressIds.length > 0) {
          await tx.order_shipping.deleteMany({ where: { address_id: { in: addressIds } } });
        }

        // Delete addresses
        await tx.user_addresses.deleteMany({ where: { user_id: id } });

        // Delete the user
        await tx.users.delete({ where: { id } });
      });

      return { message: `User with ID ${id} has been deleted successfully` };
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          `Cannot delete user with ID ${id} because they have related records that could not be removed`,
        );
      }
      throw new BadRequestException(`Failed to delete user: ${error.message || 'Unknown error'}`);
    }
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    // Check if user exists
    const user = await (this.prisma as any).users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check new password against known data breaches (HIBP k-anonymity API)
    await this.hibp.assertNotPwned(resetPasswordDto.newPassword);

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

    try {
      const updatedUser = await (this.prisma as any).users.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
        include: {
          roles: true,
        },
      });

      // Remove password and internal fields from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      return {
        message: `Password has been reset successfully for user with ID ${id}`,
        user: userWithoutPassword,
      };
    } catch {
      throw new BadRequestException('Failed to reset password');
    }
  }

  async updateProfile(
    userId: string,
    updateProfileDto: { first_name?: string; last_name?: string; phone?: string },
  ) {
    // Check if user exists
    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      const updatedUser = await (this.prisma as any).users.update({
        where: { id: userId },
        data: {
          ...(updateProfileDto.first_name !== undefined && {
            first_name: updateProfileDto.first_name,
          }),
          ...(updateProfileDto.last_name !== undefined && {
            last_name: updateProfileDto.last_name,
          }),
          ...(updateProfileDto.phone !== undefined && {
            phone: updateProfileDto.phone.replace(/\D/g, ''),
          }),
        },
        include: {
          roles: true,
        },
      });

      // Remove password and internal fields from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch {
      throw new BadRequestException('Failed to update profile');
    }
  }

  async getAddresses(userId: string) {
    return (this.prisma as any).user_addresses.findMany({
      where: { user_id: userId },
      orderBy: { is_default: 'desc' },
    });
  }

  async addAddress(userId: string, createAddressDto: CreateAddressDto) {
    const addressesCount = await (this.prisma as any).user_addresses.count({
      where: { user_id: userId },
    });

    const isFirstAddress = addressesCount === 0;

    // If it's the first address, force it to be default
    const isDefault = isFirstAddress || createAddressDto.is_default;

    if (isDefault && !isFirstAddress) {
      // If setting as default, unset other defaults
      await (this.prisma as any).user_addresses.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
    }

    return (this.prisma as any).user_addresses.create({
      data: {
        ...createAddressDto,
        user_id: userId,
        is_default: isDefault || false,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await (this.prisma as any).user_addresses.findFirst({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    await (this.prisma as any).user_addresses.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }
}
