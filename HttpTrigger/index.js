const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
const CONTAINER_NAME = "tu-container";
const BLOB_NAME = "data.json";

module.exports = async function (context, req) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);

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
};

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}
