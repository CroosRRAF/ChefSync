describe('Admin System E2E Tests', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('should load admin dashboard', () => {
    // Visit admin dashboard
    cy.visit('/admin')

    // Should redirect to login if not authenticated
    cy.url().should('include', '/login')
  })

  it('should display admin login form', () => {
    cy.visit('/admin/login')

    // Check for login form elements
    cy.get('[data-cy="email-input"]').should('be.visible')
    cy.get('[data-cy="password-input"]').should('be.visible')
    cy.get('[data-cy="login-button"]').should('be.visible')
  })

  it('should navigate admin sections', () => {
    // Mock admin authentication
    cy.window().then((win) => {
      win.localStorage.setItem('access_token', 'mock-admin-token')
    })

    cy.visit('/admin')

    // Check if main admin sections are accessible
    cy.contains('Dashboard').should('be.visible')
    cy.contains('Users').should('be.visible')
    cy.contains('Orders').should('be.visible')
    cy.contains('Settings').should('be.visible')
  })

  it('should handle responsive design', () => {
    cy.viewport('iphone-6')
    cy.visit('/admin')

    // Check mobile navigation
    cy.get('[data-cy="mobile-menu-button"]').should('be.visible')

    cy.viewport('macbook-15')
    cy.visit('/admin')

    // Check desktop navigation
    cy.get('[data-cy="sidebar"]').should('be.visible')
  })

  it('should test admin settings functionality', () => {
    // Mock admin authentication
    cy.window().then((win) => {
      win.localStorage.setItem('access_token', 'mock-admin-token')
    })

    cy.visit('/admin/settings')

    // Intercept API calls
    cy.intercept('GET', '/api/admin/settings/', { fixture: 'admin-settings.json' }).as('getSettings')

    cy.wait('@getSettings')

    // Check settings form
    cy.get('[data-cy="settings-form"]').should('be.visible')
    cy.get('[data-cy="save-settings-button"]').should('be.visible')
  })

  it('should test notification management', () => {
    // Mock admin authentication
    cy.window().then((win) => {
      win.localStorage.setItem('access_token', 'mock-admin-token')
    })

    cy.visit('/admin/notifications')

    // Intercept API calls
    cy.intercept('GET', '/api/admin/notifications/', { fixture: 'notifications.json' }).as('getNotifications')

    cy.wait('@getNotifications')

    // Check notifications display
    cy.get('[data-cy="notifications-list"]').should('be.visible')
    cy.get('[data-cy="mark-read-button"]').should('be.visible')
  })
})