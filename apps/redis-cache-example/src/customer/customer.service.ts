import { Injectable, Inject, CACHE_MANAGER } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomerServiceBase } from "./base/customer.service.base";
import { Cache } from "cache-manager";
import { Customer } from "@prisma/client";

@Injectable()
export class CustomerService extends CustomerServiceBase {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    protected readonly prisma: PrismaService
  ) {
    super(prisma);
  }

  async findCustomerById(customerId: string): Promise<Customer | null> {
    console.log("Checking cache for customer");
    const cachedCustomer = await this.cache.get(`customer_${customerId}`);

    if (cachedCustomer && typeof cachedCustomer === "string") {
      console.log("Found customer in cache");
      return JSON.parse(cachedCustomer);
    }

    console.log("Fetching customer from database");
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    console.log("Setting customer in cache");
    await this.cache.set(`customer_${customerId}`, JSON.stringify(customer), {
      ttl: parseInt(process.env.REDIS_TTL || "3600"),
    });

    return customer;
  }
}
