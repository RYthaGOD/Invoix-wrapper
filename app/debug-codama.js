
const renderers = require('@codama/renderers');
console.log('Exports from @codama/renderers:', Object.keys(renderers));

try {
    const renderersJs = require('@codama/renderers-js');
    console.log('Exports from @codama/renderers-js:', Object.keys(renderersJs));
} catch (e) {
    console.log('Could not require @codama/renderers-js');
}
