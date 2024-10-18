<template>
  <div v-if="!isLoading && !error">
    <Transformer @ready="onTransformerReady" />

    <div class="save-control columns">
      <div class="column is-1">
        <div class="tools">
          <b-dropdown
            class="settings-dropdown"
            position="is-bottom-left"
            aria-role="menu"
            trap-focus
          >
            <template #trigger>
              <b-button size="is-small" type icon-left="cog" />
            </template>

            <b-dropdown-item custom aria-role="listitem">
              <TransformerSettings />
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
      <div class="column is-1">
        <LikeButton v-if="story" :story="story" />
      </div>

      <div class="column buttons has-text-right">
        <b-button
          type
          icon-left="content-copy"
          size="is-small"
          :disabled="isShareDisabled"
          @click="copyToClipboard"
        />
        <b-button
          type
          icon-left="share-variant"
          size="is-small"
          :disabled="isShareDisabled"
          @click="saveStory"
        >
          Поделиться
        </b-button>
      </div>
    </div>
    <UserItem
      v-if="story && story.user && user && user.isSuperuser"
      :user="story.user"
    />

    <b-modal :active.sync="isShareModalActive" :width="620">
      <Share v-if="story && isShareModalActive" :story="story" />
    </b-modal>
  </div>
  <LoadingPage v-else :error="error" />
</template>

<script lang="ts" src="./Home.ts"></script>

<style scoped>
.save-control {
  padding-top: 20px;
}

.settings-dropdown ::v-deep .dropdown-menu {
  width: 400px;
  max-width: 90vw;
}

.settings-dropdown ::v-deep .dropdown-content {
  width: 100%;
}
</style>
