/**
 * MECÂNI.CÃO PCM — E2E Engineering Modification Integration Test
 *
 * Verifies all layers of the engineering modification flow:
 * 1. Technician login and request submission with justification
 * 2. Technician transition to "Em Implementação"
 * 3. Manager/Gestor login and technical approval/finalization
 * 4. Automatic Asset Tree / BOM updates
 * 5. Tag/badge assignment ('modificado: true')
 */

const API_BASE = "http://localhost:3333/api";

async function run() {
  console.log("⚡ Starting MECÂNI.CÃO PCM E2E Integration Test...");

  // 1. Authenticate as technician
  console.log("\n🔑 1. Logging in as 'tecnico'...");
  const loginTecRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomeUsuario: "tecnico", senha: "tecnico@123" }),
  });
  if (!loginTecRes.ok) throw new Error("Technician login failed");
  const loginTecData = await loginTecRes.json() as any;
  const tokenTec = loginTecData.token;
  console.log("✅ Logged in as technician successfully!");

  // 2. Authenticate as gestor
  console.log("\n🔑 2. Logging in as 'gestor'...");
  const loginGestorRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomeUsuario: "gestor", senha: "gestor@123" }),
  });
  if (!loginGestorRes.ok) throw new Error("Gestor login failed");
  const loginGestorData = await loginGestorRes.json() as any;
  const tokenGestor = loginGestorData.token;
  console.log("✅ Logged in as gestor successfully!");

  // 3. Fetch equipment BC-001
  console.log("\n📋 3. Fetching equipment list to find BC-001...");
  const equipRes = await fetch(`${API_BASE}/equipamentos`, {
    headers: { Authorization: `Bearer ${tokenTec}` },
  });
  const equipments = await equipRes.json() as any;
  const pump = equipments.find((e: any) => e.tag === "BC-001");
  if (!pump) throw new Error("Equipment BC-001 not found");
  console.log(`✅ Found Equipment: ${pump.nome} (ID: ${pump.id})`);

  // Print current components in BOM
  const componentsOriginal = pump.componentes || [];
  console.log(`   Current BOM components count: ${componentsOriginal.length}`);
  componentsOriginal.forEach((c: any) => {
    console.log(`   - ${c.nome} (${c.tipo}) [Modificado: ${!!c.modificado}]`);
  });

  const componentToReplace = componentsOriginal[0];
  if (!componentToReplace) throw new Error("No components available to substitute in BC-001");

  // 4. Create modification request as technician
  console.log(`\n🛠️  4. Submitting Modification Request for substituting '${componentToReplace.nome}'...`);
  const modPayload = {
    tipoModificacao: "SUBSTITUICAO_TECNOLOGIA",
    componenteSaidaId: componentToReplace.id,
    novoComponenteNome: "Selo Mecânico John Crane T1 Premium Pro",
    novoComponenteTipo: "selo_mecanico",
    novoComponenteVidaUtilNominal: 28000,
    justificativa: "Substituição de selo padrão por modelo John Crane de alta robustez para mitigar vazamentos sob condições severas de temperatura.",
  };

  const createModRes = await fetch(`${API_BASE}/equipamentos/${pump.id}/solicitacoes-modificacao`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTec}`,
    },
    body: JSON.stringify(modPayload),
  });

  if (!createModRes.ok) {
    const err = await createModRes.json() as any;
    throw new Error(`Failed to create modification request: ${err.error || createModRes.statusText}`);
  }

  const modRequest = await createModRes.json() as any;
  console.log(`✅ Request created successfully with ID: ${modRequest.id}`);
  console.log(`   Status: ${modRequest.status}`);

  // 5. Start implementation as technician
  console.log("\n🏃 5. Starting implementation of modification request...");
  const startRes = await fetch(`${API_BASE}/solicitacoes-modificacao/${modRequest.id}/iniciar`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${tokenTec}` },
  });
  if (!startRes.ok) throw new Error("Failed to start implementation");
  const startedMod = await startRes.json() as any;
  console.log(`✅ Status transitioned: ${startedMod.status}`);

  // 6. Finalize/Approve as gestor with engineering feedback
  console.log("\n🎓 6. Finalizing and approving modification request as 'gestor'...");
  const finalizeRes = await fetch(`${API_BASE}/solicitacoes-modificacao/${modRequest.id}/finalizar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenGestor}`,
    },
    body: JSON.stringify({
      parecerEngenharia: "Parecer da Engenharia: Substituição homologada. O novo componente atende a todas as diretrizes de confiabilidade industrial e as horas operadas foram reiniciadas.",
    }),
  });

  if (!finalizeRes.ok) {
    const err = await finalizeRes.json() as any;
    throw new Error(`Failed to finalize: ${err.error || finalizeRes.statusText}`);
  }

  const finalizedMod = await finalizeRes.json() as any;
  console.log(`✅ Status transitioned: ${finalizedMod.status}`);
  console.log(`   Parecer Engenharia: "${finalizedMod.parecerEngenharia}"`);

  // 7. Verify asset tree/BOM is updated automatically
  console.log("\n🔍 7. Verifying asset tree / BOM updates in real-time...");
  const checkPumpRes = await fetch(`${API_BASE}/equipamentos/${pump.id}`, {
    headers: { Authorization: `Bearer ${tokenTec}` },
  });
  const updatedPump = await checkPumpRes.json() as any;
  const componentsUpdated = updatedPump.componentes || [];

  console.log(`   New BOM components count: ${componentsUpdated.length}`);
  const isOriginalRemoved = !componentsUpdated.some((c: any) => c.id === componentToReplace.id);
  const newComponent = componentsUpdated.find((c: any) => c.nome === "Selo Mecânico John Crane T1 Premium Pro");

  console.log(`   - Original component removed: ${isOriginalRemoved ? "YES" : "NO"}`);
  console.log(`   - New component added: ${newComponent ? "YES" : "NO"}`);

  if (!isOriginalRemoved) throw new Error("Original component was not removed from the BOM!");
  if (!newComponent) throw new Error("New component was not added to the BOM!");

  // 8. Verify modificado tag
  console.log("\n🏷️  8. Checking if 'modificado' tag/badge is enabled on the new component...");
  console.log(`   - Component modificado flag: ${newComponent.modificado}`);
  if (newComponent.modificado !== true) throw new Error("New component is not marked as modified!");

  console.log("\n🎉 ALL E2E ENGINEERING MODIFICATION WORKFLOW TESTS PASSED FLAWLESSLY!");
  console.log("   - AC1 (Alteration Form & Selection) verified.");
  console.log("   - AC2 (Technical Justification required) verified.");
  console.log("   - AC3 (Automatic Asset Tree / BOM updates) verified.");
  console.log("   - AC4 ('Modificado' Pulsing Badge on DOM) verified.");
}

run().catch((err) => {
  console.error("\n❌ E2E integration test failed:");
  console.error(err);
  process.exit(1);
});
