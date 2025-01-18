<script lang="ts" generics="TData, TValue">
  import {
    type ColumnDef,
    type ColumnFiltersState,
    type FilterFnOption,
    type PaginationState,
    type SortingState,
    type Table as TanstackTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } from '@tanstack/table-core';
  import { queryParameters, ssp } from 'sveltekit-search-params';
  import { Button } from '$lib/components/ui/button/index.js';
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { type Snippet } from 'svelte';
  import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

  type DataTableProps<TData, TValue> = {
    table?: TanstackTable<TData>;
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    currentPage?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    /** What to render when the table is empty. */
    empty?: Snippet | string;
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    globalFilterFn?: FilterFnOption<TData> | undefined;
    globalFilterValue?: string;
    globalFilterPlaceholder?: string;
    /** The prefix for the query string key for this table. If set, the table will manage its
     * pagination, sorting, and filtering state in the query string. */
    queryStringKey?: string;
  };

  let {
    data,
    columns,
    empty,
    table = $bindable(),
    currentPage = $bindable(0),
    sorting = $bindable([]),
    columnFilters = $bindable([]),
    globalFilterFn = 'includesString',
    globalFilterValue = $bindable(''),
    globalFilterPlaceholder = 'Filter',
    pageSize = 50,
    pageSizeOptions = [10, 25, 50, 100],
    queryStringKey,
  }: DataTableProps<TData, TValue> = $props();

  let minPageSize = $derived(pageSizeOptions?.length ? Math.min(...pageSizeOptions) : 0);

  const globalFilterKey = queryStringKey + '.filter';
  const pageKey = queryStringKey + '.page';
  const filtersKey = queryStringKey + '.filters';
  const sortKey = queryStringKey + '.sort';
  const params = queryStringKey
    ? queryParameters(
        {
          [pageKey]: {
            encode: (value: number) => (value + 1).toString(),
            decode: (value: string | null) => (value ? parseInt(value, 10) - 1 : 0),
            defaultValue: '1',
          },
          [globalFilterKey]: ssp.string(''),
          [filtersKey]: {
            encode: (value: ColumnFiltersState) => (value?.length ? JSON.stringify(value) : ''),
            decode: (value) => (value ? JSON.parse(value) : []),
          },
          [sortKey]: {
            encode: (value: SortingState) => {
              if (!value?.length) {
                return '';
              }

              return value
                .map((item) => {
                  const prefix = item.desc ? '-' : '';
                  return `${prefix}${item.id}`;
                })
                .join('|');
            },
            decode: (value) => {
              if (!value) {
                return [];
              }

              return value.split('|').map((item) => {
                if (item[0] === '-') {
                  return {
                    id: item.slice(1),
                    desc: true,
                  };
                } else {
                  return {
                    id: item,
                    desc: false,
                  };
                }
              });
            },
          },
        },
        {
          pushHistory: false,
          showDefaults: false,
        }
      )
    : undefined;

  function init() {
    if (!params || !queryStringKey) {
      return;
    }

    const page = params[pageKey];
    if (page != null) {
      currentPage = page;
    }

    const filters = params[filtersKey];
    if (filters != null) {
      columnFilters = filters;
    }

    const sort = params[sortKey];
    if (sort != null) {
      sorting = sort;
    }

    const globalFilter = params[globalFilterKey];
    if (globalFilter) {
      globalFilterValue = globalFilter;
    }
  }

  init();

  table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    state: {
      get columnFilters() {
        return columnFilters;
      },
      get globalFilter() {
        return globalFilterValue;
      },
      get pagination() {
        return pageSize ? { pageIndex: currentPage, pageSize } : undefined;
      },
      get sorting() {
        return sorting;
      },
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }

      if (params) {
        params[sortKey] = sorting;
      }
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        let pagination = updater({ pageIndex: currentPage, pageSize });
        currentPage = pagination.pageIndex;
        pageSize = pagination.pageSize;
      } else {
        currentPage = updater.pageIndex;
        pageSize = updater.pageSize;
      }

      if (params) {
        params[pageKey] = currentPage;
      }
    },
    onColumnFiltersChange: (updater) => {
      if (typeof updater === 'function') {
        columnFilters = updater(columnFilters);
      } else {
        columnFilters = updater;
      }

      if (params) {
        params[filtersKey] = columnFilters;
      }
    },
  });
</script>

<div>
  <div class="rounded-md border">
    {#if globalFilterFn}
      <Input
        bind:value={
          () => globalFilterValue,
          (newValue) => {
            globalFilterValue = newValue;
            if (params) {
              params[globalFilterKey] = newValue;
            }
          }
        }
        placeholder={globalFilterPlaceholder}
        class="rounded-b-none"
      />
    {/if}
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && 'selected'}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">
              {#if typeof empty === 'string'}
                {empty}
              {:else if typeof empty === 'function'}
                {@render empty()}
              {:else}
                No results.
              {/if}</Table.Cell
            >
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
  {#if pageSize > 0 && data.length > minPageSize}
    <div class="flex items-center justify-end gap-2 py-4">
      {#if pageSizeOptions.length}
        <div class="flex items-center space-x-2">
          <p class="text-xs font-medium text-muted-foreground">Rows per page</p>
          <Select.Root
            type="single"
            onValueChange={(selected) => (pageSize = Number(selected))}
            value={pageSize.toString()}
          >
            <Select.Trigger class="h-8 w-[70px]">{pageSize}</Select.Trigger>
            <Select.Content>
              {#each pageSizeOptions as option}
                <Select.Item value={option.toString()}>{option}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}
      <span class="text-xs font-medium text-muted-foreground">
        Page {currentPage + 1} of {table.getPageCount()}
      </span>
      <Button
        variant="outline"
        size="sm"
        class="h-8 w-8 p-0"
        onclick={() => table.firstPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <span class="sr-only">First Page</span>
        <ChevronsLeft size={15} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 w-8 p-0"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <span class="sr-only">Previous Page</span>
        <ChevronLeft size={15} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 w-8 p-0"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <span class="sr-only">Next Page</span>
        <ChevronRight size={15} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 w-8 p-0"
        onclick={() => table.lastPage()}
        disabled={!table.getCanNextPage()}
      >
        <span class="sr-only">Last Page</span>
        <ChevronsRight size={15} />
      </Button>
    </div>
  {/if}
</div>
