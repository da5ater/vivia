import {
    CreateSecretCommand,
    GetSecretValueCommand,
    type GetSecretValueCommandOutput,
    PutSecretValueCommand,
    ResourceExistsException,
    SecretsManagerClient,
    ListSecretsCommand,
} from "@aws-sdk/client-secrets-manager";

function validateAwsEnv() {
    const missing = [];
    if (!process.env.AWS_REGION) missing.push("AWS_REGION");
    if (!process.env.AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
    if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
}

let _client: SecretsManagerClient | null = null;

function getClient(): SecretsManagerClient {
    if (!_client) {
        validateAwsEnv();
        _client = new SecretsManagerClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            },
        });
    }
    return _client;
}

export async function validateAwsConnection(): Promise<void> {
    const client = getClient();
    await client.send(new ListSecretsCommand({ MaxResults: 1 }));
}

export async function getSecretValue(
    ctx: unknown, secretName: string,
): Promise<GetSecretValueCommandOutput> {
    const client = getClient();
    return await client.send(
        new GetSecretValueCommand({ SecretId: secretName }),
    );
}

export async function upsertSecret(
    secretName: string,
    secretValue: Record<string, unknown>,
): Promise<void> {
    const client = getClient();
    const secretString = JSON.stringify(secretValue);

    try {
        await client.send(
            new CreateSecretCommand({
                Name: secretName,
                SecretString: secretString,
            }),
        );
    } catch (error) {
        if (error instanceof ResourceExistsException) {
            await client.send(
                new PutSecretValueCommand({
                    SecretId: secretName,
                    SecretString: secretString,
                }),
            );
        } else {
            throw error;
        }
    }
}

export function parseSecretString<T = Record<string, unknown>>(
    secret: GetSecretValueCommandOutput,
): T | null {
    if (!secret.SecretString) return null;

    try {
        return JSON.parse(secret.SecretString) as T;
    } catch {
        return null;
    }
}