const fs = require('fs');
let c = fs.readFileSync('app/bookmarks/page.tsx', 'utf-8');
const lines = c.split('\n');

// Replace lines 381-438 (0-indexed: 380-437) with new index-based implementation
const before = lines.slice(0, 380);
const after = lines.slice(438);

const newLines = [
  `                        return (`,
  `                          <>`,
  `                            {(() => {`,
  `                              const allItems: any[] = [`,
  `                                ...subgroupNames.map(sgName => {`,
  `                                  const sg = subgroups.find((s: any) => s.name === sgName && s.group === group);`,
  `                                  return { type: 'subgroup', name: sgName, position: sg?.position ?? 0 };`,
  `                                }),`,
  `                                ...ungrouped.map(b => ({ type: 'bookmark', data: b, position: b.position ?? 0 })),`,
  `                              ].sort((a, b) => a.position - b.position);`,
  ``,
  `                              const DropZone = ({ toIndex }: { toIndex: number }) => (`,
  `                                <div`,
  "                                  className={`h-1 transition-all ${draggedSubgroup ? 'hover:h-6 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded' : ''}`}",
  `                                  onDragOver={(e) => { if (draggedSubgroup) e.preventDefault(); }}`,
  "                                  onDrop={(e) => { e.preventDefault(); if (draggedSubgroup) { const fromIndex = allItems.findIndex(it => it.type === 'subgroup' && it.name === draggedSubgroup.name); handleSubgroupDrop(group, fromIndex, toIndex, allItems); } }}",
  `                                />`,
  `                              );`,
  ``,
  `                              return allItems.map((item, index) => (`,
  `                                <div key={item.type === 'subgroup' ? item.name : item.data.id}>`,
  `                                  <DropZone toIndex={index} />`,
  `                                  {item.type === 'subgroup' ? (() => {`,
  `                                    const sgName = item.name;`,
  "                                    const sgKey = `${group}::${sgName}`;",
  `                                    const sgItems = items.filter((b: any) => b.subgroup === sgName);`,
  `                                    const isCollapsed = collapsedSubgroups[sgKey];`,
  `                                    const subgroupData = subgroups.find((sg: any) => sg.name === sgName && sg.group === group);`,
  `                                    return (`,
  `                                      <>`,
  `                                        <div`,
  "                                          className={`flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 select-none ${draggedSubgroup?.name === sgName && draggedSubgroup?.group === group ? 'opacity-50' : ''}`}",
  `                                          draggable`,
  `                                          onDragStart={() => setDraggedSubgroup({ name: sgName, group })}`,
  `                                          onDragEnd={() => setDraggedSubgroup(null)}`,
  `                                          onClick={() => { const updated = { ...collapsedSubgroups, [sgKey]: !isCollapsed }; setCollapsedSubgroups(updated); saveSettings.mutate({ collapsedSubgroups: updated }); }}`,
  `                                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, bookmark: { isSubgroup: true, name: sgName, group, subgroupData } }); }}`,
  `                                        >`,
  `                                          <GripVerticalIcon className="w-3 h-3 text-slate-300 shrink-0" />`,
  "                                          <ChevronRightIcon className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isCollapsed ? '' : 'rotate-90'}`} />",
  `                                          {subgroupData?.icon && <img src={subgroupData.icon} className="w-3.5 h-3.5 shrink-0" />}`,
  `                                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-1 truncate">{sgName}</span>`,
  `                                          <span className="text-[9px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-1 rounded">{sgItems.length}</span>`,
  `                                        </div>`,
  `                                        {!isCollapsed && sgItems.map((b: any) => (`,
  `                                          <div key={b.id} className="pl-4">{renderBookmark(b)}</div>`,
  `                                        ))}`,
  `                                      </>`,
  `                                    );`,
  `                                  })() : (`,
  `                                    renderBookmark(item.data)`,
  `                                  )}`,
  `                                  {index === allItems.length - 1 && <DropZone toIndex={allItems.length} />}`,
  `                                </div>`,
  `                              ));`,
  `                            })()}`,
  `                          </>`,
];

const result = [...before, ...newLines, ...after].join('\n');
fs.writeFileSync('app/bookmarks/page.tsx', result);
process.stdout.write('Done. Lines: ' + result.split('\n').length + '\n');
