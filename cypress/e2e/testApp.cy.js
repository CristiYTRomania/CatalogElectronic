describe("tets", () => {
  it("Should work properly", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    indexedDB.deleteDatabase("firebaseLocalStorageDb"); // șterge cache-ul de login Firebase

    cy.visit("http://localhost:3000");

    cy.get('input[name="email"]').type("dobriceanionut1408@gmail.com");
    cy.get('input[name="pass"]').type("1234567");
    cy.get("#login-btn").click();

    cy.wait(10000);
    cy.get('input[name="mfaCode"]').type("123456");
    cy.get("#login-btn").click();

    cy.wait(20000);
    cy.contains("span.ant-menu-title-content", "Clase").click();
    cy.get("div.ant-card-meta-title").contains("a V-a D").click();
    cy.wait(2000);
    cy.get("span.anticon-plus").first().click();
    cy.contains("span", "OK").click();
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const formattedDate = `${day}.${month}`;
    cy.wait(8000);
    cy.contains(formattedDate);
    cy.contains("SUCCES");
  });
});
