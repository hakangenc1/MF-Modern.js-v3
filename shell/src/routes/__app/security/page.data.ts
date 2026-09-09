import { loadDevices, loadSecurityOverview, loadSessions } from "security/data";
export const loader = async () => {
  const [overview, devices, sessions] = await Promise.all([
    loadSecurityOverview(), loadDevices(), loadSessions(),
  ]);
  return { overview, devices, sessions };
};
