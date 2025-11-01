import { DynamoUserRepository } from '../DynamoUserRepository';
import { DynamoDB } from 'aws-sdk';

describe('DynamoUserRepository', () => {
  test('getByEmail calls DynamoDB with correct params', async () => {
    const getMock = jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Item: { email: 'a', password: 'b' } }) });
    const docClient = { get: getMock } as unknown as DynamoDB.DocumentClient;
    const repo = new DynamoUserRepository('users', docClient);

    const user = await repo.getByEmail('a');
    expect(getMock).toHaveBeenCalledWith({ TableName: 'users', Key: { email: 'a' } });
    expect(user).toEqual({ email: 'a', password: 'b' });
  });
});
