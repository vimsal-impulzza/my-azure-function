const { BlobServiceClient } = require('@azure/storage-blob');

const accountName  = "datatestingfunction";
const CONTAINER_NAME = "datatestingfunction";
const BLOB_NAME = "data.json";

module.exports = async function (context, req) {
    if (!accountName) {
        context.res = {
            status: 500,
            body: "STORAGE_ACCOUNT_NAME is not defined in environment settings"
        };
        return;
    }

    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
        if (req.method === "GET") {
            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);

            context.res = {
                status: 200,
                body: JSON.parse(downloaded)
            };
        } else if (req.method === "POST") {
            const data = req.body;
            const content = JSON.stringify(data);
            await blockBlobClient.upload(content, Buffer.byteLength(content), { overwrite: true });

            context.res = {
                status: 200,
                body: { message: "JSON actualizado exitosamente" }
            };
        } else {
            context.res = {
                status: 405,
                body: "Método no permitido"
            };
        }
    } catch (error) {
        context.log.error("Error al acceder al blob:", error.message);
        context.res = {
            status: 500,
            body: "Error al acceder al blob: " + error.message
        };
    }
};

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}
