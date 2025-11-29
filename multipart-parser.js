function parseMultipartFormData(buffer, boundary) {
    // Convert to latin1 string for binary-safe split and slicing
    const str = buffer.toString('latin1');
    const boundaryString = `--${boundary}`;
    const parts = str.split(boundaryString);
    const result = { fields: {}, files: {} };

    for (let i = 1; i < parts.length - 1; i++) {
        const part = parts[i];
        const partTrimmed = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
        const headerEndIndex = partTrimmed.indexOf('\r\n\r\n');
        if (headerEndIndex === -1) continue;

        const headersText = partTrimmed.slice(0, headerEndIndex);
        const dataText = partTrimmed.slice(headerEndIndex + 4);

        const headers = headersText.split('\r\n').reduce((acc, line) => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const name = line.slice(0, colonIndex).trim().toLowerCase();
                const value = line.slice(colonIndex + 1).trim();
                acc[name] = value;
            }
            return acc;
        }, {});

        const contentDisposition = headers['content-disposition'];
        if (contentDisposition) {
            const nameMatch = /name="([^"]+)"/.exec(contentDisposition);
            const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition);

            if (nameMatch) {
                const fieldName = nameMatch[1];

                if (filenameMatch) {
                    // This is a file
                    const filename = filenameMatch[1];
                    // Convert dataText back to Buffer preserving binary
                    const dataBuffer = Buffer.from(dataText, 'latin1');
                    result.files[fieldName] = {
                        filename: filename,
                        data: dataBuffer,
                        contentType: headers['content-type']
                    };
                } else {
                    // This is a regular form field
                    result.fields[fieldName] = dataText;
                }
            }
        }
    }
    return result;
}

module.exports = { parseMultipartFormData };
