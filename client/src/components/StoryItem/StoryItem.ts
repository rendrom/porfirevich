import { ToastProgrammatic as Toast } from 'buefy';
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

import { escapeHtml } from '../../../../shared/utils/escapeHtml';
import config from '@shared/config';
import StoryService from '../../services/StoryService';
import { useAppStore } from '../../store/app';
import LikeButton from '../LikeButton';

import type { Story } from '@shared/types/Story';

const appModule = useAppStore();

@Component({ components: { LikeButton } })
export default class StoryItem extends Vue {
  @Prop({ type: Object }) readonly story!: Story;

  violationLoading = false;
  deleteLoading = false;
  publishLoading = false;

  get content() {
    const c = JSON.parse(this.story.content) as [string, number][];
    let html = '';
    c.forEach((x) => {
      let text = escapeHtml(x[0]);
      text = text.replace(/\n/g, '<br>');
      if (x[1]) {
        html += `<strong style="color:${this.color}">${text}</strong>`;
      } else {
        html += `<span>${text}</span>`;
      }
      // lineBreaks.forEach(() => {
      //   html += '<br>';
      // });
    });
    return html;
  }

  get color() {
    return config.primaryColor;
  }

  get user() {
    return appModule.user;
  }

  get userCanEdit() {
    return this.isSuperuser || this.isOwner;
  }

  get isOwner() {
    return this.user && this.user.id === this.story.user?.id;
  }

  get isSuperuser() {
    return this.user && this.user.isSuperuser;
  }

  get alreadySet(): boolean {
    return appModule.liked.includes(this.story.id);
  }

  get disabled() {
    return !appModule.user;
  }

  @Emit()
  show() {
    return this.story;
  }

  go() {
    this.$router.push('/' + this.story.id);
  }

  async remove() {
    this.deleteLoading = true;
    try {
      const deleted = await StoryService.edit(this.story.id, {
        isDeleted: !this.story.isDeleted,
      });
      if (deleted) {
        appModule.updateStory({
          id: this.story.id,
          params: { isDeleted: deleted.isDeleted },
        });
      }
    } catch {
      //
    }
    this.deleteLoading = false;
  }

  async publish() {
    this.publishLoading = true;
    try {
      const resp = await StoryService.edit(this.story.id, {
        isPublic: !this.story.isPublic,
      });
      if (resp) {
        appModule.updateStory({
          id: this.story.id,
          params: { isPublic: resp.isPublic },
        });
      }
    } catch {
      //
    }
    this.publishLoading = false;
  }

  async violation() {
    this.violationLoading = true;
    try {
      await StoryService.violation(this.story);
      Toast.open({
        message: 'Спасибо, сообщение о нарушение отправлено на рассмотрение',
        type: 'is-success',
        position: 'is-bottom',
        duration: 6000,
      });
    } catch (er) {
      console.log(er);
    } finally {
      this.violationLoading = false;
    }
  }
}
