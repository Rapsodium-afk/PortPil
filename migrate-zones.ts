import { prisma } from './src/lib/prisma';

async function migrate() {
    console.log('--- Database Consolidation Started ---');
    
    // 1. Define mappings
    const mapping = {
        'TTP1': ['ZAS-ADT', 'IMPORT', 'EXPORT-OTROS', 'ADR', 'TTP1'],
        'TTP2': ['TTP2'],
        'ZONAS AUX': ['PK5', 'TTIA', 'CANTIL', 'PK4']
    };

    const toDelete = ['AUTO_ZONE', 'UNKNOWN', '35€"'];

    // 2. Update movement_vehiculo table
    for (const [target, sources] of Object.entries(mapping)) {
        console.log(`Mapping ${sources.join(', ')} to ${target}...`);
        await prisma.movimiento_Vehiculo.updateMany({
            where: { terminal_id: { in: sources } },
            data: { terminal_id: target }
        });
        
        await prisma.historico_Ocupacion_Snapshot.updateMany({
            where: { terminal_id: { in: sources } },
            data: { terminal_id: target }
        });
    }

    // 3. Ensure target zones exist in terminal_zona
    console.log('Ensuring target zones exist...');
    for (const id of Object.keys(mapping)) {
        await prisma.terminal_Zona.upsert({
            where: { id },
            update: { activa: true },
            create: {
                id,
                nombre: id === 'ZONAS AUX' ? 'Zonas Auxiliares' : id,
                capacidad_maxima: id === 'ZONAS AUX' ? 1000 : 500,
                activa: true
            }
        });
    }

    // 4. Delete redundant zones from terminal_zona
    const allKnownSources = Object.values(mapping).flat();
    const zonesToRemove = await prisma.terminal_Zona.findMany({
        where: {
            OR: [
                { id: { in: toDelete } },
                { id: { in: allKnownSources, notIn: Object.keys(mapping) } }
            ]
        }
    });

    console.log(`Removing ${zonesToRemove.length} redundant zone definitions...`);
    for (const zone of zonesToRemove) {
        // Only delete if no movements remain (safety check)
        const count = await prisma.movimiento_Vehiculo.count({ where: { terminal_id: zone.id } });
        if (count === 0) {
            await prisma.terminal_Zona.delete({ where: { id: zone.id } });
        } else {
            console.warn(`Cannot delete zone ${zone.id}, still has ${count} movements (should have been migrated)`);
        }
    }

    console.log('--- Migration Finished Successfully ---');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
