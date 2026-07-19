import prisma from "./utils";

async function main() {
  await prisma.employee.create({
    data: {
      bank: Math.random().toString(),
      bank_acc_num: Math.random().toString(),
      bank_ifsc: Math.random().toString(),
      designation: Math.random().toString(),
      email: Math.random().toString(),
      name: Math.random().toString(),
      pan_num: Math.random().toString(),
      phone_num: Math.random().toString(),
    },
  });

  await prisma.employee.create({
    data: {
      bank: Math.random().toString(),
      bank_acc_num: Math.random().toString(),
      bank_ifsc: Math.random().toString(),
      designation: Math.random().toString(),
      email: Math.random().toString(),
      name: Math.random().toString(),
      pan_num: Math.random().toString(),
      phone_num: Math.random().toString(),
    },
  });
  await prisma.employee.create({
    data: {
      bank: Math.random().toString(),
      bank_acc_num: Math.random().toString(),
      bank_ifsc: Math.random().toString(),
      designation: Math.random().toString(),
      email: Math.random().toString(),
      name: Math.random().toString(),
      pan_num: Math.random().toString(),
      phone_num: Math.random().toString(),
    },
  });
  await prisma.employee.create({
    data: {
      bank: Math.random().toString(),
      bank_acc_num: Math.random().toString(),
      bank_ifsc: Math.random().toString(),
      designation: Math.random().toString(),
      email: Math.random().toString(),
      name: Math.random().toString(),
      pan_num: Math.random().toString(),
      phone_num: Math.random().toString(),
    },
  });
  await prisma.employee.create({
    data: {
      bank: Math.random().toString(),
      bank_acc_num: Math.random().toString(),
      bank_ifsc: Math.random().toString(),
      designation: Math.random().toString(),
      email: Math.random().toString(),
      name: Math.random().toString(),
      pan_num: Math.random().toString(),
      phone_num: Math.random().toString(),
    },
  });
  await prisma.employee.create({
    data: {
      bank: Math.random().toString(),
      bank_acc_num: Math.random().toString(),
      bank_ifsc: Math.random().toString(),
      designation: Math.random().toString(),
      email: Math.random().toString(),
      name: Math.random().toString(),
      pan_num: Math.random().toString(),
      phone_num: Math.random().toString(),
    },
  });
}

main();
