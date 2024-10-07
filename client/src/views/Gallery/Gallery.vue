<template>
  <div>
    <div class="columns is-mobile">
      <div class="column">
        <div class="block">
          <b-radio
            v-for="s in sortItems"
            :key="s.text"
            v-model="sort"
            name="sort"
            :native-value="s.value"
            :disabled="isLoading"
            >{{ s.text }}</b-radio
          >
        </div>
      </div>
      <div class="field is-horizontal">
        <div v-if="usePeriods || user" class="field-label is-small mr-1">
          <label class="label">Показать</label>
        </div>
        <div class="field mr-1">
          <b-select
            v-if="user"
            v-model="filter"
            size="is-small"
            :disabled="isLoading"
          >
            <option v-for="f in filterItems" :key="f.text" :value="f.value">
              {{ f.text }}
            </option>
          </b-select>
        </div>
        <div v-if="usePeriods" class="field-label is-small mr-1">
          <label class="label">за:</label>
        </div>
        <div v-if="usePeriods" class="field-body">
          <div class="field">
            <b-select v-model="period" size="is-small" :disabled="isLoading">
              <option v-for="p in periods" :key="p.text" :value="p.value">
                {{ p.text }}
              </option>
            </b-select>
          </div>
        </div>
        <div class="field-label is-small mr-1">
          <label class="label">содержит</label>
        </div>
        <div class="field-body">
          <div class="field">
            <b-taginput
              v-model="tags"
              maxlength="20"
              maxtags="5"
              size="is-small"
              :disabled="isLoading"
              :has-counter="false"
              :before-adding="beforeTagAdding"
            />
            <!-- <b-input
              v-model="query"
              maxlength="20"
              placeholder="текст"
              size="is-small"
              :disabled="isLoading"
              icon-right="magnify"
              icon-right-clickable
              @icon-right-click="onQueryChange"
            >
            </b-input> -->
          </div>
        </div>
      </div>
    </div>
    <div v-for="i in stories" :key="i.id" class="columns">
      <div class="column">
        <story-item :story="i" @show="showStory" />
      </div>
    </div>
    <div class="columns">
      <div class="column has-text-centered">
        <b-button
          type
          :loading="isLoading"
          :disabled="!hasMore"
          @click="loadMore"
          >Загрузить ещё</b-button
        >
      </div>
    </div>
    <b-modal :active.sync="isShareModalActive" :width="620">
      <Share v-if="isShareModalActive" v-model="story" />
    </b-modal>
  </div>
</template>

<script lang="ts" src="./Gallery.ts"></script>

<style scoped></style>
