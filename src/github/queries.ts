export const CITY_METRICS_QUERY = `
query CityMetrics($login: String!, $fromYear: DateTime!, $to: DateTime!, $fromMonth: DateTime!, $mergedSearch: String!) {
  user(login: $login) {
    login
    contribYear: contributionsCollection(from: $fromYear, to: $to) {
      commitContributionsByRepository(maxRepositories: 100) {
        contributions {
          totalCount
        }
        repository {
          name
          nameWithOwner
          isPrivate
          stargazerCount
          primaryLanguage {
            name
            color
          }
        }
      }
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
    contribMonth: contributionsCollection(from: $fromMonth, to: $to) {
      commitContributionsByRepository(maxRepositories: 100) {
        contributions {
          totalCount
        }
        repository {
          nameWithOwner
        }
      }
    }
  }
  search(query: $mergedSearch, type: ISSUE, first: 1) {
    issueCount
  }
  rateLimit {
    remaining
    resetAt
  }
}
`;
