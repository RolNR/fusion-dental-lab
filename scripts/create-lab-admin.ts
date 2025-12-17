import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n=== Crear Laboratorio y Administrador Inicial ===\n');

  // Laboratory info
  const labName = await question('Nombre del laboratorio: ');
  const labEmail = await question('Email del laboratorio (opcional): ');
  const labPhone = await question('Teléfono del laboratorio (opcional): ');
  const labAddress = await question('Dirección del laboratorio (opcional): ');

  console.log('\n--- Información del Administrador ---\n');

  // Admin user info
  const adminName = await question('Nombre del administrador: ');
  const adminEmail = await question('Email del administrador: ');
  const adminPassword = await question('Contraseña del administrador: ');

  rl.close();

  console.log('\n📝 Creando laboratorio y administrador...\n');

  try {
    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.error('❌ Error: Ya existe un usuario con ese email');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create laboratory and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create laboratory
      const laboratory = await tx.laboratory.create({
        data: {
          name: labName,
          email: labEmail || null,
          phone: labPhone || null,
          address: labAddress || null,
          isActive: true,
        },
      });

      // Create admin user
      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: 'LAB_ADMIN',
          laboratoryId: laboratory.id,
        },
      });

      return { laboratory, admin };
    });

    console.log('✅ Laboratorio y administrador creados exitosamente!\n');
    console.log('Laboratorio:', result.laboratory.name);
    console.log('ID del Laboratorio:', result.laboratory.id);
    console.log('\nAdministrador:', result.admin.name);
    console.log('Email:', result.admin.email);
    console.log('\n🎉 Ahora puedes iniciar sesión con estas credenciales\n');
  } catch (error) {
    console.error('❌ Error al crear laboratorio y administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
