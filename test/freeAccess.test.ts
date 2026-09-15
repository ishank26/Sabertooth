/* eslint-disable @typescript-eslint/no-explicit-any */
import "mocha";
import { expect } from "chai";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getRawHandler, IHandler } from "../lambda";
import { ApiKeyDao } from "../lambda/dao/apiKeyDao";
import { OauthDao } from "../lambda/dao/oauthDao";
import { userTableNames } from "../lambda/dao/userDao";
import { Storage_getDefault } from "../src/models/storage";
import { buildMockDi, IMockDI } from "./utils/mockDi";
import { MockFetch } from "./utils/mockFetch";
import { MockLogUtil } from "./utils/mockLogUtil";
import sinon from "sinon";

function buildMcpEvent(body: unknown, headers?: Record<string, string>): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: headers || {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/mcp",
    pathParameters: {},
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    stageVariables: {},
    requestContext: {} as any,
    resource: "",
  };
}

function buildApiEvent(path: string, apiKey?: string): APIGatewayProxyEvent {
  return {
    body: null,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path,
    pathParameters: {},
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    stageVariables: {},
    requestContext: {} as any,
    resource: "",
  };
}

function toolCall(name: string): object {
  return { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: {} } };
}

function parseBody(result: APIGatewayProxyResult): any {
  return JSON.parse(result.body);
}

describe("Sabertooth subscription-free authenticated access", () => {
  let sandbox: sinon.SinonSandbox;
  let di: IMockDI;
  let handler: IHandler;
  let userId: string;
  let previousRequireSubscription: string | undefined;

  const ctx = { getRemainingTimeInMillis: () => 10000 };

  beforeEach(() => {
    previousRequireSubscription = process.env.LFT_REQUIRE_SUBSCRIPTION;
    process.env.LFT_REQUIRE_SUBSCRIPTION = "false";

    (global as any).__API_HOST__ = "https://www.liftosaur.com";
    (global as any).__HOST__ = "https://www.liftosaur.com";
    (global as any).__ENV__ = "prod";
    (global as any).__FULL_COMMIT_HASH__ = "abc123";
    (global as any).__COMMIT_HASH__ = "abc123";
    (global as any).Rollbar = { configure: () => undefined };

    sandbox = sinon.createSandbox();
    let ts = 1000000;
    sandbox.stub(Date, "now").callsFake(() => {
      ts += 1;
      return ts;
    });

    const storage = Storage_getDefault();
    userId = storage.tempUserId;
    storage.subscription = {};

    const log = new MockLogUtil();
    const mockFetch = new MockFetch(userId, []);
    di = buildMockDi(log, mockFetch.fetch.bind(mockFetch));
    handler = getRawHandler(() => di);
    mockFetch.handler = handler;

    di.dynamo.addMockData({
      [userTableNames.prod.users]: {
        [JSON.stringify({ id: userId })]: {
          id: userId,
          email: "test@example.com",
          createdAt: Date.now(),
          storage,
        },
      },
    });
  });

  afterEach(() => {
    sandbox.restore();
    if (previousRequireSubscription == null) {
      delete process.env.LFT_REQUIRE_SUBSCRIPTION;
    } else {
      process.env.LFT_REQUIRE_SUBSCRIPTION = previousRequireSubscription;
    }
  });

  it("allows OAuth-authenticated MCP account tools without a subscription", async () => {
    const token = await new OauthDao(di).createToken("test-client", userId);
    const result = await handler(
      buildMcpEvent(toolCall("list_programs"), { Authorization: `Bearer ${token.token}` }),
      ctx
    );

    expect(result.statusCode).to.equal(200);
    const body = parseBody(result);
    expect(body.result.isError).to.be.undefined;
  });

  it("allows API-key-authenticated REST calls without a subscription", async () => {
    const apiKey = await new ApiKeyDao(di).create(userId, "free-access-test");
    const result = await handler(buildApiEvent("/api/v1/programs", apiKey.key), ctx);

    expect(result.statusCode).to.equal(200);
    expect(parseBody(result).data.programs).to.deep.equal([]);
  });

  it("still rejects unauthenticated MCP account tools", async () => {
    const result = await handler(buildMcpEvent(toolCall("list_programs")), ctx);
    expect(result.statusCode).to.equal(401);
  });

  it("still rejects unauthenticated REST calls", async () => {
    const result = await handler(buildApiEvent("/api/v1/programs"), ctx);
    expect(result.statusCode).to.equal(401);
  });
});
