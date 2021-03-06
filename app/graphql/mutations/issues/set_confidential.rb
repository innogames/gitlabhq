# frozen_string_literal: true

module Mutations
  module Issues
    class SetConfidential < Base
      graphql_name 'IssueSetConfidential'

      argument :confidential,
               GraphQL::BOOLEAN_TYPE,
               required: true,
               description: 'Whether or not to set the issue as a confidential.'

      def resolve(project_path:, iid:, confidential:)
        issue = authorized_find!(project_path: project_path, iid: iid)
        project = issue.project

        ::Issues::UpdateService.new(project: project, current_user: current_user, params: { confidential: confidential })
          .execute(issue)

        {
          issue: issue,
          errors: errors_on_object(issue)
        }
      end
    end
  end
end
