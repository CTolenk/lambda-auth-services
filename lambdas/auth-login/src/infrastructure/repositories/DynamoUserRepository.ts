import { DynamoDB } from 'aws-sdk';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class DynamoUserRepository implements UserRepository {
  private docClient: DynamoDB.DocumentClient;

  constructor(private tableName: string, docClient?: DynamoDB.DocumentClient) {
    this.docClient = docClient || new DynamoDB.DocumentClient();
  }

  async getByEmail(email: string): Promise<User | null> {
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: { email },
    };

    const result = await this.docClient.get(params).promise();
    return result.Item as User || null;
  }
}
