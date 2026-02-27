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
    if (!process.env.AWS_REGION) {
        throw new Error("AWS_REGION is missing");
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error("AWS credentials are missing");
    }
}

export function createSecretsManagerClient(): SecretsManagerClient {
    validateAwsEnv();

    return new SecretsManagerClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
    });
}

export async function validateAwsConnection(): Promise<void> {
    const client = createSecretsManagerClient();
    await client.send(new ListSecretsCommand({ MaxResults: 1 }));
}

export async function getSecretValue(
    secretName: string,
): Promise<GetSecretValueCommandOutput> {
    const client = createSecretsManagerClient();
    return await client.send(
        new GetSecretValueCommand({ SecretId: secretName }),
    );
}

export async function upsertSecret(
    secretName: string,
    secretValue: Record<string, unknown>,
): Promise<void> {
    const client = createSecretsManagerClient();

    try {
        await client.send(
            new CreateSecretCommand({
                Name: secretName,
                SecretString: JSON.stringify(secretValue),
            }),
        );
    } catch (error) {
        if (error instanceof ResourceExistsException) {
            await client.send(
                new PutSecretValueCommand({
                    SecretId: secretName,
                    SecretString: JSON.stringify(secretValue),
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