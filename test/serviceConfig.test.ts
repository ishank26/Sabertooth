import "mocha";
import { expect } from "chai";
import { ServiceConfig_mcpServerName, ServiceConfig_publicBaseUrl } from "../lambda/utils/serviceConfig";

describe("Sabertooth service configuration", () => {
  let previousPublicUrl: string | undefined;
  let previousGenericUrl: string | undefined;
  let previousServerName: string | undefined;
  let previousGenericServerName: string | undefined;
  let previousIsLocal: string | undefined;
  let previousIsDev: string | undefined;

  beforeEach(() => {
    previousPublicUrl = process.env.SABERTOOTH_PUBLIC_URL;
    previousGenericUrl = process.env.PUBLIC_BASE_URL;
    previousServerName = process.env.SABERTOOTH_MCP_SERVER_NAME;
    previousGenericServerName = process.env.MCP_SERVER_NAME;
    previousIsLocal = process.env.IS_LOCAL;
    previousIsDev = process.env.IS_DEV;

    delete process.env.SABERTOOTH_PUBLIC_URL;
    delete process.env.PUBLIC_BASE_URL;
    delete process.env.SABERTOOTH_MCP_SERVER_NAME;
    delete process.env.MCP_SERVER_NAME;
    process.env.IS_LOCAL = "false";
    process.env.IS_DEV = "false";
  });

  afterEach(() => {
    restore("SABERTOOTH_PUBLIC_URL", previousPublicUrl);
    restore("PUBLIC_BASE_URL", previousGenericUrl);
    restore("SABERTOOTH_MCP_SERVER_NAME", previousServerName);
    restore("MCP_SERVER_NAME", previousGenericServerName);
    restore("IS_LOCAL", previousIsLocal);
    restore("IS_DEV", previousIsDev);
  });

  it("uses a configured self-host public origin and trims trailing slashes", () => {
    process.env.SABERTOOTH_PUBLIC_URL = "https://fitness.example.com///";
    expect(ServiceConfig_publicBaseUrl()).to.equal("https://fitness.example.com");
  });

  it("keeps the upstream URL as a compatibility fallback", () => {
    expect(ServiceConfig_publicBaseUrl()).to.equal("https://www.liftosaur.com");
  });

  it("supports configurable MCP server identity", () => {
    process.env.SABERTOOTH_MCP_SERVER_NAME = "sabertooth-mcp";
    expect(ServiceConfig_mcpServerName()).to.equal("sabertooth-mcp");
  });

  it("keeps the upstream MCP name as a library compatibility fallback", () => {
    expect(ServiceConfig_mcpServerName()).to.equal("liftosaur-mcp");
  });
});

function restore(name: string, value: string | undefined): void {
  if (value == null) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
