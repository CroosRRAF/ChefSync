// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    cy.visit('/login')
    cy.get('[data-cy="email-input"]').type('admin@chefsync.com')
    cy.get('[data-cy="password-input"]').type('admin123')
    cy.get('[data-cy="login-button"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Custom command to check if element is visible within viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  cy.window().then((win) => {
    const rect = subject[0].getBoundingClientRect()
    expect(rect.top).to.be.greaterThan(0)
    expect(rect.bottom).to.be.lessThan(win.innerHeight)
    expect(rect.left).to.be.greaterThan(0)
  })
  return subject
})

// Custom command to wait for API calls to complete
Cypress.Commands.add('waitForAPI', (method = 'GET', url = '') => {
  cy.intercept(method, url).as('apiCall')
  cy.wait('@apiCall')
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
      isInViewport(): Chainable<JQuery<HTMLElement>>
      waitForAPI(method?: string, url?: string): Chainable<void>
    }
  }
}

export {}