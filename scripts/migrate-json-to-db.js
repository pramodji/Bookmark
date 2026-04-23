// Run once: node scripts/migrate-json-to-db.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const dataPath = process.env.DATA_JSON_PATH || path.join(__dirname, '..', 'data.json');

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.log('No data.json found, skipping migration.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const now = new Date().toISOString();

  // Bookmarks
  if (data.bookmarks?.length) {
    for (const b of data.bookmarks) {
      await prisma.bookmark.upsert({
        where: { id: String(b.id) },
        update: {},
        create: {
          id: String(b.id),
          title: b.title || '',
          url: b.url || '',
          description: b.description || '',
          tags: Array.isArray(b.tags) ? b.tags.join(',') : (b.tags || ''),
          icon: b.icon || '',
          notes: b.notes || '',
          group: b.group || 'General',
          position: b.position ?? 0,
          favorite: b.favorite || false,
          createdAt: b.createdAt || now,
          updatedAt: b.updatedAt || now,
        },
      });
    }
    console.log(`Migrated ${data.bookmarks.length} bookmarks`);
  }

  // Groups
  if (data.groups?.length) {
    await prisma.group.deleteMany();
    await prisma.group.createMany({
      data: data.groups.map((name, position) => ({ name, position })),
    });
    console.log(`Migrated ${data.groups.length} groups`);
  }

  // Notes
  if (data.notes?.length) {
    for (const n of data.notes) {
      await prisma.note.upsert({
        where: { id: String(n.id) },
        update: {},
        create: {
          id: String(n.id),
          title: n.title || '',
          content: n.content || '',
          tags: Array.isArray(n.tags) ? n.tags.join(',') : (n.tags || ''),
          pinned: n.pinned || false,
          createdAt: n.createdAt || now,
          updatedAt: n.updatedAt || now,
        },
      });
    }
    console.log(`Migrated ${data.notes.length} notes`);
  }

  // Tasks
  if (data.tasks?.length) {
    for (const t of data.tasks) {
      await prisma.task.upsert({
        where: { id: String(t.id) },
        update: {},
        create: {
          id: String(t.id),
          title: t.title || '',
          description: t.description || '',
          completed: t.completed || false,
          priority: t.priority || 'medium',
          dueDate: t.dueDate || null,
          tags: Array.isArray(t.tags) ? t.tags.join(',') : (t.tags || ''),
          createdAt: t.createdAt || now,
          updatedAt: t.updatedAt || now,
        },
      });
    }
    console.log(`Migrated ${data.tasks.length} tasks`);
  }

  // Sticky Notes
  if (data.stickyNotes?.length) {
    for (const s of data.stickyNotes) {
      await prisma.stickyNote.upsert({
        where: { id: String(s.id) },
        update: {},
        create: {
          id: String(s.id),
          content: s.content || '',
          color: s.color || 'yellow',
          position: s.position ?? 0,
          createdAt: s.createdAt || now,
          updatedAt: s.updatedAt || now,
        },
      });
    }
    console.log(`Migrated ${data.stickyNotes.length} sticky notes`);
  }

  // Note Templates
  if (data.noteTemplates?.length) {
    for (const t of data.noteTemplates) {
      await prisma.noteTemplate.upsert({
        where: { id: String(t.id) },
        update: {},
        create: {
          id: String(t.id),
          title: t.title || '',
          content: t.content || '',
          tags: Array.isArray(t.tags) ? t.tags.join(',') : (t.tags || ''),
          builtIn: t.builtIn || false,
          createdAt: t.createdAt || now,
        },
      });
    }
    console.log(`Migrated ${data.noteTemplates.length} note templates`);
  }

  // Icons
  if (data.icons?.length) {
    for (const icon of data.icons) {
      await prisma.icon.upsert({ where: { data: icon }, update: {}, create: { data: icon } });
    }
    console.log(`Migrated ${data.icons.length} icons`);
  }

  // Backfill date field for notes/tasks that have no date
  const notesWithoutDate = await prisma.note.findMany({ where: { OR: [{ date: null }, { date: '' }] } });
  for (const n of notesWithoutDate) {
    await prisma.note.update({ where: { id: n.id }, data: { date: n.createdAt.split('T')[0] } });
  }
  if (notesWithoutDate.length) console.log(`Backfilled date for ${notesWithoutDate.length} notes`);

  const tasksWithoutDate = await prisma.task.findMany({ where: { OR: [{ date: null }, { date: '' }] } });
  for (const t of tasksWithoutDate) {
    await prisma.task.update({ where: { id: t.id }, data: { date: t.createdAt.split('T')[0] } });
  }
  if (tasksWithoutDate.length) console.log(`Backfilled date for ${tasksWithoutDate.length} tasks`);

  console.log('Migration complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
