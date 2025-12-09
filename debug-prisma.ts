
import { Prisma } from '@prisma/client';

const fields = Object.keys(Prisma.ReviewScalarFieldEnum);
console.log('Has reviewerExpertise:', fields.includes('reviewerExpertise'));
console.log('All fields:', fields.sort());
