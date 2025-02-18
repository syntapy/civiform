import {
  ApplicantQuestions,
  createTestContext,
  loginAsAdmin,
  loginAsGuest,
  logout,
  selectApplicantLanguage,
} from './support'

describe('Hide a program that should not be public yet', () => {
  const ctx = createTestContext()
  it('Create a new hidden program, verify applicants cannot see it on the home page', async () => {
    const {page, adminPrograms} = ctx

    await loginAsAdmin(page)

    // Create a hidden program
    const programName = 'hidden-program'
    const programDescription = 'Description'
    await adminPrograms.addProgram(programName, programDescription, '', true)
    await adminPrograms.publishAllPrograms()

    // Login as applicant
    await logout(page)
    await loginAsGuest(page)
    await selectApplicantLanguage(page, 'English')
    const applicantQuestions = new ApplicantQuestions(page)
    await applicantQuestions.validateHeader('en-US')

    // Verify the program cannot be seen
    await applicantQuestions.expectProgramHidden(programName)

    await logout(page)
  })

  it('create a public program, verify applicants can see it on the home page', async () => {
    const {page, adminPrograms} = ctx

    await loginAsAdmin(page)

    // Create a hidden program
    const programName = 'public-program'
    const programDescription = 'Description'
    await adminPrograms.addProgram(programName, programDescription, '', false)
    await adminPrograms.publishAllPrograms()

    // Login as applicant
    await logout(page)

    // Verify applicants can now see the program
    await loginAsGuest(page)
    const applicantQuestions = new ApplicantQuestions(page)
    await selectApplicantLanguage(page, 'English')
    await applicantQuestions.expectProgramPublic(
      programName,
      programDescription,
    )
  })
})
