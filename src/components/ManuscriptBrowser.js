import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, usePagination, useFilters, useGlobalFilter } from 'react-table';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, Grid, Typography, IconButton, TablePagination,
  Chip, Box, CircularProgress, Collapse, Card, CardContent,
  Tooltip
} from '@material-ui/core';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowUpward as SortUpIcon,
  ArrowDownward as SortDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenInNewIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { loadManuscriptData, searchManuscripts, getUniqueFieldValues } from '../services/dataService';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  searchBar: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  filterSection: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 200,
  },
  table: {
    minWidth: 650,
    '& .MuiTableCell-root': {
      fontSize: '1.25rem', // Increase font size from 0.75rem to 1.25rem
    }
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  arrayCell: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  clickableRow: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  pagination: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
  },
  filterChip: {
    margin: theme.spacing(0.5),
    backgroundColor: theme.palette.primary.light,
  },
  activeFiltersContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  filterGroup: {
    marginBottom: theme.spacing(2),
  },
  addFilterButton: {
    marginTop: theme.spacing(2),
  },
  filterCard: {
    marginBottom: theme.spacing(2),
  },
  expandButton: {
    marginRight: theme.spacing(1),
  },
  detailsCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButton: {
    minWidth: 'auto',
  }
}));

// Default columns for the manuscript table
const defaultColumns = [
  {
    Header: 'الرقم التسلسلي',
    accessor: 'unique_id',
    width: '10%',
  },
  {
    Header: 'الفن',
    accessor: 'categories',
    Cell: ({ value }) => (
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {Array.isArray(value) && value.map((category, i) => (
          <Chip key={i} label={category} size="small" style={{ margin: '2px' }} />
        ))}
      </div>
    ),
    width: '15%',
  },
  {
    Header: 'عنوان المخطوط',
    accessor: 'titles',
    Cell: ({ value }) => (
      <div>
        {Array.isArray(value) && value.map((title, i) => (
          <div key={i} style={{ marginBottom: '4px' }}>{title}</div>
        ))}
      </div>
    ),
    width: '25%',
  },
  {
    Header: 'اسم المؤلف',
    accessor: 'author',
    width: '20%',
  },
  {
    Header: 'اسم الشهرة',
    accessor: 'shuhras',
    Cell: ({ value }) => (
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {Array.isArray(value) && value.map((shuhra, i) => (
          <Chip key={i} label={shuhra} size="small" style={{ margin: '2px' }} />
        ))}
      </div>
    ),
    width: '15%',
  },
  {
    Header: 'تاريخ الوفاة',
    accessor: 'death_date',
    width: '10%',
  },
  {
    Header: 'قرن الوفاة',
    accessor: 'century',
    width: '5%',
  },
  {
    Header: 'تفاصيل',
    accessor: 'details',
    Cell: ({ row }) => (
      <ActionsCell manuscriptId={row.original.unique_id} />
    ),
    disableSortBy: true,
    width: '5%',
  }
];

// Component for the details button
const ActionsCell = ({ manuscriptId }) => {
  const classes = useStyles();

  const handleOpenDetails = (e) => {
    e.stopPropagation(); // Prevent row click event
    // Open details in a new window
    window.open(`/manuscript/${manuscriptId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={classes.detailsCell}>
      <Tooltip title="عرض التفاصيل في نافذة جديدة" arrow>
        <IconButton
          size="small"
          color="primary"
          onClick={handleOpenDetails}
          className={classes.detailsButton}
        >
          <OpenInNewIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

// Available filter types
const filterTypes = [
  { id: 'categories', label: 'الفن' },
  { id: 'century', label: 'قرن الوفاة' },
  { id: 'death_date_range', label: 'نطاق تاريخ الوفاة' },
  { id: 'author', label: 'اسم المؤلف' },
  { id: 'shuhras', label: 'اسم الشهرة' },
  { id: 'titles', label: 'عنوان المخطوط' }
];

const ManuscriptBrowser = () => {
  const classes = useStyles();

  // State for data and loading
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandAdvancedFilters, setExpandAdvancedFilters] = useState(false);

  // Advanced filtering
  const [filters, setFilters] = useState([]);
  const [availableFilterTypes, setAvailableFilterTypes] = useState(filterTypes);

  // State for filter options
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [centuryOptions, setCenturyOptions] = useState([]);
  const [authorOptions, setAuthorOptions] = useState([]);
  const [shuhraOptions, setShuhraOptions] = useState([]);
  const [titleOptions, setTitleOptions] = useState([]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadManuscriptData();
        setManuscripts(data);

        // Load filter options
        const categories = await getUniqueFieldValues('categories');
        const centuries = await getUniqueFieldValues('century');
        const authors = await getUniqueFieldValues('author');
        const shuhras = await getUniqueFieldValues('shuhras');
        const titles = await getUniqueFieldValues('titles');

        setCategoryOptions(categories);
        setCenturyOptions(centuries);
        setAuthorOptions(authors);
        setShuhraOptions(shuhras);
        setTitleOptions(titles);

        setLoading(false);
      } catch (error) {
        console.error('Error loading manuscript data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add new filter
  const addFilter = (type) => {
    let initialValue = '';

    // For date range, set initial values
    if (type === 'death_date_range') {
      initialValue = { min: '', max: '' };
    }

    setFilters([...filters, { type, value: initialValue }]);

    // Remove the filter type from available types to prevent duplicates
    // Only for single-value filters (keep date range available)
    if (type !== 'death_date_range') {
      setAvailableFilterTypes(availableFilterTypes.filter(ft => ft.id !== type));
    }
  };

  // Remove a filter
  const removeFilter = (index) => {
    const filterToRemove = filters[index];

    // Add the filter type back to available types
    if (filterToRemove.type !== 'death_date_range' ||
      !filters.some((f, i) => i !== index && f.type === 'death_date_range')) {
      const typeToAdd = filterTypes.find(ft => ft.id === filterToRemove.type);
      if (typeToAdd) {
        setAvailableFilterTypes([...availableFilterTypes, typeToAdd]);
      }
    }

    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);

    // Apply filters immediately after removal
    if (newFilters.length > 0) {
      applyFilters(newFilters);
    } else {
      resetFilters();
    }
  };

  // Update filter value
  const updateFilterValue = (index, value) => {
    const newFilters = [...filters];
    newFilters[index].value = value;
    setFilters(newFilters);
  };

  // Update date range filter
  const updateDateRangeFilter = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index].value = {
      ...newFilters[index].value,
      [field]: value
    };
    setFilters(newFilters);
  };

  // Convert filters to filterCriteria object expected by searchManuscripts
  const getFilterCriteria = (currentFilters) => {
    const criteria = {};

    currentFilters.forEach(filter => {
      if (filter.type === 'death_date_range') {
        // Special handling for date range
        criteria.death_date_range = filter.value;
      } else if (filter.type && filter.value) {
        // Regular filters
        criteria[filter.type] = filter.value;
      }
    });

    return criteria;
  };

  // Apply filters
  const applyFilters = async (currentFilters = filters) => {
    setLoading(true);

    try {
      let fieldsToSearch = [];

      if (searchField !== 'all') {
        fieldsToSearch = [searchField];
      }

      const filterCriteria = getFilterCriteria(currentFilters);
      const results = await searchManuscripts(searchTerm, fieldsToSearch, filterCriteria);
      setManuscripts(results);
    } catch (error) {
      console.error('Error applying filters:', error);
    }

    setLoading(false);
  };

  // Reset all filters
  const resetFilters = async () => {
    setSearchTerm('');
    setSearchField('all');
    setFilters([]);
    setAvailableFilterTypes(filterTypes);

    setLoading(true);

    try {
      const data = await loadManuscriptData();
      setManuscripts(data);
    } catch (error) {
      console.error('Error resetting data:', error);
    }

    setLoading(false);
  };

  // Handle search
  const handleSearch = async () => {
    setLoading(true);

    try {
      let fieldsToSearch = [];

      if (searchField !== 'all') {
        fieldsToSearch = [searchField];
      }

      const filterCriteria = getFilterCriteria(filters);
      const results = await searchManuscripts(searchTerm, fieldsToSearch, filterCriteria);
      setManuscripts(results);
    } catch (error) {
      console.error('Error searching manuscripts:', error);
    }

    setLoading(false);
  };

  // Memoize the columns configuration
  const columns = useMemo(() => defaultColumns, []);

  // Memoize the data for the table
  const data = useMemo(() => manuscripts, [manuscripts]);

  // Set up the table instance with our hooks
  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { pageSize: 25 }
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Destructure properties and methods from the table instance
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    gotoPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = tableInstance;

  // Handle row click to navigate to details
  const handleRowClick = (manuscriptId) => {
    // Open in a new window instead of navigating in the same window
    window.open(`/manuscript/${manuscriptId}`, '_blank', 'noopener,noreferrer');
  };

  // Get filter options based on filter type
  const getOptionsForFilter = (filterType) => {
    switch (filterType) {
      case 'categories':
        return categoryOptions;
      case 'century':
        return centuryOptions;
      case 'author':
        return authorOptions;
      case 'shuhras':
        return shuhraOptions;
      case 'titles':
        return titleOptions;
      default:
        return [];
    }
  };

  // Get filter label
  const getFilterLabel = (filterType) => {
    const filter = filterTypes.find(ft => ft.id === filterType);
    return filter ? filter.label : filterType;
  };

  // Render filter input based on filter type
  const renderFilterInput = (filter, index) => {
    const { type, value } = filter;

    if (type === 'death_date_range') {
      return (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="من"
              value={value.min}
              onChange={(e) => updateDateRangeFilter(index, 'min', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="إلى"
              value={value.max}
              onChange={(e) => updateDateRangeFilter(index, 'max', e.target.value)}
              size="small"
            />
          </Grid>
        </Grid>
      );
    } else {
      const options = getOptionsForFilter(type);

      if (options.length > 0) {
        return (
          <FormControl variant="outlined" fullWidth size="small">
            <InputLabel>{getFilterLabel(type)}</InputLabel>
            <Select
              value={value}
              onChange={(e) => updateFilterValue(index, e.target.value)}
              label={getFilterLabel(type)}
            >
              <MenuItem value="">
                <em>الكل</em>
              </MenuItem>
              {options.map((option, i) => (
                <MenuItem key={i} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      } else {
        return (
          <TextField
            fullWidth
            variant="outlined"
            label={getFilterLabel(type)}
            value={value}
            onChange={(e) => updateFilterValue(index, e.target.value)}
            size="small"
          />
        );
      }
    }
  };

  // Render active filters as chips
  const renderActiveFilters = () => {
    if (filters.length === 0) return null;

    return (
      <div className={classes.activeFiltersContainer}>
        <Typography variant="subtitle2" style={{ marginRight: '8px', marginTop: '4px' }}>
          التصفيات النشطة:
        </Typography>
        {filters.map((filter, index) => {
          let label = '';

          if (filter.type === 'death_date_range') {
            if (filter.value.min && filter.value.max) {
              label = `${getFilterLabel(filter.type)}: ${filter.value.min} - ${filter.value.max}`;
            } else if (filter.value.min) {
              label = `${getFilterLabel(filter.type)}: من ${filter.value.min}`;
            } else if (filter.value.max) {
              label = `${getFilterLabel(filter.type)}: إلى ${filter.value.max}`;
            } else {
              label = getFilterLabel(filter.type);
            }
          } else {
            label = `${getFilterLabel(filter.type)}: ${filter.value || 'الكل'}`;
          }

          return (
            <Chip
              key={index}
              label={label}
              onDelete={() => removeFilter(index)}
              className={classes.filterChip}
              size="small"
            />
          );
        })}

        <Button
          size="small"
          onClick={resetFilters}
          startIcon={<ClearIcon />}
          style={{ marginRight: '8px' }}
        >
          إزالة الكل
        </Button>
      </div>
    );
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        فهرس المخطوطات
      </Typography>

      {/* Search Bar */}
      <Paper className={classes.searchBar} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              variant="outlined"
              label="بحث"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>حقل البحث</InputLabel>
              <Select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                label="حقل البحث"
              >
                <MenuItem value="all">جميع الحقول</MenuItem>
                <MenuItem value="unique_id">الرقم التسلسلي</MenuItem>
                <MenuItem value="categories">الفن</MenuItem>
                <MenuItem value="titles">عنوان المخطوط</MenuItem>
                <MenuItem value="author">اسم المؤلف</MenuItem>
                <MenuItem value="shuhras">اسم الشهرة</MenuItem>
                <MenuItem value="death_date">تاريخ الوفاة</MenuItem>
                <MenuItem value="century">قرن الوفاة</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              style={{ marginRight: 8 }}
            >
              بحث
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              style={{ marginRight: 8 }}
            >
              {showFilters ? 'إخفاء التصفية' : 'إظهار التصفية'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={resetFilters}
            >
              إعادة تعيين
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {renderActiveFilters()}
      </Paper>

      {/* Advanced Filters Section */}
      {showFilters && (
        <Paper className={classes.filterSection} elevation={2}>
          <Box display="flex" alignItems="center" onClick={() => setExpandAdvancedFilters(!expandAdvancedFilters)} style={{ cursor: 'pointer' }}>
            <IconButton className={classes.expandButton} size="small">
              {expandAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography variant="subtitle1">
              التصفية المتقدمة
            </Typography>
          </Box>

          <Collapse in={expandAdvancedFilters}>
            <Box mt={2}>
              {/* Current Filters */}
              {filters.map((filter, index) => (
                <Card key={index} className={classes.filterCard} variant="outlined">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={10}>
                        {renderFilterInput(filter, index)}
                      </Grid>
                      <Grid item xs={2}>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => removeFilter(index)}
                          size="small"
                          fullWidth
                        >
                          إزالة
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              {/* Add Filter Section */}
              {availableFilterTypes.length > 0 && (
                <Box mt={2}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={8}>
                      <FormControl variant="outlined" fullWidth size="small">
                        <InputLabel>إضافة تصفية</InputLabel>
                        <Select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addFilter(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          label="إضافة تصفية"
                        >
                          <MenuItem value="">
                            <em>اختر نوع التصفية</em>
                          </MenuItem>
                          {availableFilterTypes.map((filterType, index) => (
                            <MenuItem key={index} value={filterType.id}>{filterType.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={applyFilters}
                        fullWidth
                      >
                        تطبيق التصفيات
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* Results Count */}
          <Box my={2}>
            <Typography variant="subtitle1">
              {manuscripts.length} مخطوطة
            </Typography>
          </Box>

          {/* Data Table */}
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table {...getTableProps()} className={classes.table} stickyHeader>
              <TableHead>
                {headerGroups.map(headerGroup => (
                  <TableRow {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                      <TableCell
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        style={{ fontWeight: 'bold', width: column.width }}
                      >
                        {column.render('Header')}
                        <span>
                          {column.isSorted
                            ? column.isSortedDesc
                              ? <SortDownIcon fontSize="small" />
                              : <SortUpIcon fontSize="small" />
                            : ''}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody {...getTableBodyProps()}>
                {page.map(row => {
                  prepareRow(row);
                  return (
                    <TableRow
                      {...row.getRowProps()}
                      className={classes.clickableRow}
                      onClick={() => handleRowClick(row.original.unique_id)}
                    >
                      {row.cells.map(cell => (
                        <TableCell {...cell.getCellProps()}>
                          {cell.render('Cell')}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={manuscripts.length}
            rowsPerPage={pageSize}
            page={pageIndex}
            onPageChange={(event, newPage) => gotoPage(newPage)}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
            }}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            labelRowsPerPage="صفوف في الصفحة:"
          />
        </>
      )}
    </div>
  );
};

export default ManuscriptBrowser;