import { DocumentClientLike } from './document-client-factory.port';
import { UserRepository } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';

export class DynamoDbUserRepository implements UserRepository {
  constructor(
    private readonly documentClient: DocumentClientLike,
    private readonly tableName: string
  ) {}

  async save(user: User): Promise<void> {
    const primitives = user.toPrimitives();

    await this.documentClient
      .put({
        TableName: this.tableName,
        Item: {
          id: primitives.id,
          email: primitives.email,
          passwordHash: primitives.passwordHash,
          createdAt: primitives.createdAt.toISOString()
        },
        ConditionExpression: 'attribute_not_exists(email)'
      })
      .promise();
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: { email }
      })
      .promise();

    if (!result.Item) {
      return null;
    }

    return User.create({
      id: result.Item.id as string,
      email: result.Item.email as string,
      passwordHash: result.Item.passwordHash as string,
      createdAt: new Date(result.Item.createdAt as string)
    });
  }
}
