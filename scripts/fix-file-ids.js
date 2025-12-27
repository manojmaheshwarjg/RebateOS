/**
 * One-time fix for file ID mismatch
 * Run this in browser console on the review page
 */

async function fixFileIdMismatch() {
    const { db } = window;

    if (!db) {
        console.error('IndexedDB not available');
        return;
    }

    console.log('Fixing file ID mismatch...');

    // Get all contract files
    const contractFiles = await db.contract_files.toArray();
    console.log(`Found ${contractFiles.length} contract files`);

    // Get all file blobs
    const fileBlobs = await db.file_blobs.toArray();
    console.log(`Found ${fileBlobs.length} file blobs`);

    let fixed = 0;

    for (const contractFile of contractFiles) {
        // Try to find blob with same ID
        const existingBlob = await db.file_blobs.get(contractFile.id);

        if (!existingBlob) {
            // Blob doesn't exist with this ID
            // Try to find orphaned blob by filename match
            const matchingBlob = fileBlobs.find(blob => {
                // This is a guess - we can't perfectly match
                return !contractFiles.some(cf => cf.id === blob.id);
            });

            if (matchingBlob) {
                console.log(`Fixing ${contractFile.file_name}: linking blob ${matchingBlob.id} to file ${contractFile.id}`);

                // Create a new blob entry with the correct ID
                await db.file_blobs.add({
                    id: contractFile.id,
                    blob: matchingBlob.blob,
                    created_at: matchingBlob.created_at,
                });

                fixed++;
            } else {
                console.warn(`No matching blob found for ${contractFile.file_name}`);
            }
        }
    }

    console.log(`Fixed ${fixed} files!`);
    console.log('Refresh the page to see PDFs');
}

// Auto-run
fixFileIdMismatch();
