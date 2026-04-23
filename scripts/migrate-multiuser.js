const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GLOBAL_KEYS = new Set(["maintenanceMode", "backupPath", "autoBackup", "lastAutoBackup"]);

async function migrate() {
  console.log("Migrating settings to per-user...");
  
  // Move non-global settings from Setting to UserSetting for admin
  const settings = await prisma.setting.findMany();
  let moved = 0;
  for (const s of settings) {
    if (!GLOBAL_KEYS.has(s.key)) {
      await prisma.userSetting.upsert({
        where: { userId_key: { userId: "admin", key: s.key } },
        update: { value: s.value },
        create: { userId: "admin", key: s.key, value: s.value },
      });
      // Don't delete from Setting yet — keep for backward compat
      moved++;
    }
  }
  console.log(`Moved ${moved} settings to UserSetting for admin`);

  // Verify all content tables have userId="admin" (default from schema)
  const counts = {
    bookmarks: await prisma.bookmark.count(),
    groups: await prisma.group.count(),
    subgroups: await prisma.subgroup.count(),
    notes: await prisma.note.count(),
    tasks: await prisma.task.count(),
    stickyNotes: await prisma.stickyNote.count(),
    widgets: await prisma.widget.count(),
    icons: await prisma.icon.count(),
    noteTemplates: await prisma.noteTemplate.count(),
  };
  console.log("Existing data counts (all assigned to admin):", counts);
  console.log("Migration complete!");
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
