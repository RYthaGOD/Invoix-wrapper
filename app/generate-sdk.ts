
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderJavaScriptVisitor } from '@codama/renderers';
import { join } from 'path';

// Using require for JSON in CJS context (handled by tsx/ts-node)
const idl = require('../target/idl/c_spl_wrapper.json');

(async () => {
    try {
        console.log('Starting SDK generation...');
        // Create Codama Root Node
        const root = rootNodeFromAnchor(idl);

        // Generate SDK
        const outputDir = join(__dirname, 'src/generated');

        console.log('Rendering to:', outputDir);
        const codama = createFromRoot(root);
        await codama.accept(renderJavaScriptVisitor(outputDir));

        console.log('SDK generated successfully at', outputDir);
    } catch (e) {
        console.error('SDK Verification Failed:', e);
        process.exit(1);
    }
})();
