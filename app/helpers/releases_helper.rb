# frozen_string_literal: true

module ReleasesHelper
  IMAGE_PATH = 'illustrations/releases.svg'
  DOCUMENTATION_PATH = 'user/project/releases/index'

  def illustration
    image_path(IMAGE_PATH)
  end

  def help_page(anchor: nil)
    help_page_path(DOCUMENTATION_PATH, anchor: anchor)
  end

  def data_for_releases_page
    {
      project_id: @project.id,
      project_path: @project.full_path,
      illustration_path: illustration,
      documentation_path: help_page
    }.tap do |data|
      if can?(current_user, :create_release, @project)
        data[:new_release_path] = if Feature.enabled?(:new_release_page, @project, default_enabled: true)
                                    new_project_release_path(@project)
                                  else
                                    new_project_tag_path(@project)
                                  end
      end
    end
  end

  def data_for_show_page
    {
      project_id: @project.id,
      project_path: @project.full_path,
      tag_name: @release.tag
    }
  end

  def data_for_edit_release_page
    new_edit_pages_shared_data.merge(
      tag_name: @release.tag,
      releases_page_path: project_releases_path(@project, anchor: @release.tag)
    )
  end

  def data_for_new_release_page
    new_edit_pages_shared_data.merge(
      default_branch: @project.default_branch,
      releases_page_path: project_releases_path(@project)
    )
  end

  def group_milestone_project_releases_available?(project)
    false
  end

  private

  def new_edit_pages_shared_data
    {
      project_id: @project.id,
      group_id: @project.group&.id,
      group_milestones_available: group_milestone_project_releases_available?(@project),
      project_path: @project.full_path,
      markdown_preview_path: preview_markdown_path(@project),
      markdown_docs_path: help_page_path('user/markdown'),
      release_assets_docs_path: help_page(anchor: 'release-assets'),
      manage_milestones_path: project_milestones_path(@project),
      new_milestone_path: new_project_milestone_path(@project)
    }
  end
end

ReleasesHelper.prepend_mod_with('ReleasesHelper')
