<script>
import { EDITOR_READY_EVENT } from '~/editor/constants';
import { CiSchemaExtension } from '~/editor/extensions/editor_ci_schema_ext';
import EditorLite from '~/vue_shared/components/editor_lite.vue';
import glFeatureFlagMixin from '~/vue_shared/mixins/gl_feature_flags_mixin';
import getCommitSha from '../../graphql/queries/client/commit_sha.graphql';

export default {
  components: {
    EditorLite,
  },
  mixins: [glFeatureFlagMixin()],
  inject: ['ciConfigPath', 'projectPath', 'projectNamespace', 'defaultBranch'],
  inheritAttrs: false,
  data() {
    return {
      commitSha: '',
    };
  },
  apollo: {
    commitSha: {
      query: getCommitSha,
    },
  },
  methods: {
    onCiConfigUpdate(content) {
      this.$emit('updateCiConfig', content);
    },
    registerCiSchema() {
      if (this.glFeatures.schemaLinting) {
        const editorInstance = this.$refs.editor.getEditor();

        editorInstance.use(new CiSchemaExtension({ instance: editorInstance }));
        editorInstance.registerCiSchema({
          projectPath: this.projectPath,
          projectNamespace: this.projectNamespace,
          ref: this.commitSha || this.defaultBranch,
        });
      }
    },
  },
  readyEvent: EDITOR_READY_EVENT,
};
</script>
<template>
  <div class="gl-border-solid gl-border-gray-100 gl-border-1">
    <editor-lite
      ref="editor"
      :file-name="ciConfigPath"
      v-bind="$attrs"
      @[$options.readyEvent]="registerCiSchema"
      @input="onCiConfigUpdate"
      v-on="$listeners"
    />
  </div>
</template>
