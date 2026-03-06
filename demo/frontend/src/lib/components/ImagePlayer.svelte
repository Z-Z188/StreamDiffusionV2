<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { lcmLiveStatus, LCMLiveStatus, streamId } from '$lib/lcmLive';
  import { getPipelineValues } from '$lib/store';

  import Button from '$lib/components/Button.svelte';
  import Floppy from '$lib/icons/floppy.svelte';
  import { snapImage } from '$lib/utils';

  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
  $: console.log('isLCMRunning', isLCMRunning);

  let imageEl: HTMLImageElement;

  // ✅ 用于拼接正确的 API 前缀，本地是 ""，KML 上是 "/proxy/7860"
  let basePath = '';
  let streamSrc = '';

  onMount(() => {
    if (browser) {
      // 去掉末尾的 /
      basePath = window.location.pathname.replace(/\/$/, '');
    }
  });

  // ✅ 当 streamId 变化时，更新图片地址
  $: if ($streamId && isLCMRunning) {
    // 加一个时间戳防缓存
    streamSrc = `${basePath}/api/stream/${$streamId}?t=${Date.now()}`;
  } else {
    streamSrc = '';
  }

  async function takeSnapshot() {
    if (isLCMRunning) {
      await snapImage(imageEl, {
        prompt: getPipelineValues()?.prompt,
        negative_prompt: getPipelineValues()?.negative_prompt,
        seed: getPipelineValues()?.seed,
        guidance_scale: getPipelineValues()?.guidance_scale
      });
    }
  }
</script>

<div
  class="relative mx-auto aspect-square max-w-lg self-center overflow-hidden rounded-lg border border-slate-300"
>
  <!-- svelte-ignore a11y-missing-attribute -->
  {#if isLCMRunning && $streamId && streamSrc}
    <img
      bind:this={imageEl}
      class="aspect-square w-full rounded-lg"
      src={streamSrc}
    />
    <div class="absolute bottom-1 right-1">
      <Button
        on:click={takeSnapshot}
        disabled={!isLCMRunning}
        title={'Take Snapshot'}
        classList={'text-sm ml-auto text-white p-1 shadow-lg rounded-lg opacity-50'}
      >
        <Floppy classList={''} />
      </Button>
    </div>
  {:else}
    <img
      class="aspect-square w-full rounded-lg"
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    />
  {/if}
</div>
