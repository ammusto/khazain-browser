import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Grid, Chip, Divider, Button,
  Card, CardContent, List, ListItem, ListItemText,
  CardHeader, CircularProgress, Box
} from '@material-ui/core';
import { 
  ArrowBack as BackIcon, 
  LocationOn as LocationIcon,
  Book as BookIcon,
  Person as PersonIcon,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { loadManuscriptData, getManuscriptLocations } from '../services/dataService';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    fontSize: '2rem'
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  section: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  locationCard: {
    marginBottom: theme.spacing(2),
  },
  backButton: {
    marginBottom: theme.spacing(2),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
  },
  label: {
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
  },
  titleSection: {
    marginBottom: theme.spacing(1),
  },
}));

const ManuscriptDetails = () => {
  const classes = useStyles();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [manuscript, setManuscript] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchManuscriptData = async () => {
      setLoading(true);
      
      try {
        // Load manuscript metadata
        const allManuscripts = await loadManuscriptData();
        const foundManuscript = allManuscripts.find(m => m.unique_id === id);
        
        if (!foundManuscript) {
          setError('المخطوطة غير موجودة');
          setLoading(false);
          return;
        }
        
        setManuscript(foundManuscript);
        
        // Load manuscript locations
        const locationData = await getManuscriptLocations(id);
        setLocations(locationData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading manuscript details:', error);
        setError('حدث خطأ أثناء تحميل بيانات المخطوطة');
        setLoading(false);
      }
    };
    
    fetchManuscriptData();
  }, [id]);
  
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={classes.root}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          className={classes.backButton}
        >
          العودة
        </Button>
        <Paper className={classes.paper}>
          <Typography variant="h5" color="error" align="center">
            {error}
          </Typography>
        </Paper>
      </div>
    );
  }
  
  if (!manuscript) return null;
  
  return (
    <div className={classes.root}>
      <Button
        variant="outlined"
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        className={classes.backButton}
      >
        العودة إلى القائمة
      </Button>
      
      <Paper className={classes.paper}>
        {/* Manuscript Header */}
        <Box mb={2}>
          <Typography variant="h4" gutterBottom>
            {manuscript.titles && manuscript.titles.length > 0
              ? manuscript.titles[0]
              : 'بدون عنوان'
            }
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            الرقم التسلسلي: {manuscript.unique_id}
          </Typography>
        </Box>
        
        <Divider className={classes.divider} />
        
        {/* Manuscript Details */}
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="معلومات المخطوط"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<BookIcon color="primary" />} 
              />
              <CardContent>
                {/* Categories */}
                <div className={classes.section}>
                  <Typography variant="subtitle2" className={classes.label}>
                    الفن:
                  </Typography>
                  <Box mt={1}>
                    {manuscript.categories && manuscript.categories.length > 0 ? (
                      manuscript.categories.map((category, index) => (
                        <Chip 
                          key={index} 
                          label={category} 
                          className={classes.chip}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2">غير محدد</Typography>
                    )}
                  </Box>
                </div>
                
                {/* All Titles */}
                {manuscript.titles && manuscript.titles.length > 1 && (
                  <div className={classes.section}>
                    <Typography variant="subtitle2" className={classes.label}>
                      العناوين البديلة:
                    </Typography>
                    <List dense>
                      {manuscript.titles.slice(1).map((title, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemText primary={title} />
                        </ListItem>
                      ))}
                    </List>
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Author Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="معلومات المؤلف"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<PersonIcon color="primary" />} 
              />
              <CardContent>
                {/* Author */}
                <div className={classes.section}>
                  <Typography variant="subtitle2" className={classes.label}>
                    اسم المؤلف:
                  </Typography>
                  <Typography variant="body1">{manuscript.author || 'غير معروف'}</Typography>
                </div>
                
                {/* Shuhras */}
                <div className={classes.section}>
                  <Typography variant="subtitle2" className={classes.label}>
                    اسم الشهرة:
                  </Typography>
                  <Box mt={1}>
                    {manuscript.shuhras && manuscript.shuhras.length > 0 ? (
                      manuscript.shuhras.map((shuhra, index) => (
                        <Chip 
                          key={index} 
                          label={shuhra} 
                          className={classes.chip}
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2">غير محدد</Typography>
                    )}
                  </Box>
                </div>
                
                {/* Dates */}
                <div className={classes.section}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" className={classes.label}>
                        تاريخ الوفاة:
                      </Typography>
                      <Typography variant="body1">
                        {manuscript.death_date || 'غير معروف'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" className={classes.label}>
                        قرن الوفاة:
                      </Typography>
                      <Typography variant="body1">
                        {manuscript.century || 'غير معروف'}
                      </Typography>
                    </Grid>
                  </Grid>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Divider className={classes.divider} />
        
        {/* Manuscript Locations */}
        <Typography variant="h6" gutterBottom>
          <LocationIcon /> نسخ المخطوط في العالم
        </Typography>
        
        {locations && locations.length > 0 ? (
          <Grid container spacing={2}>
            {locations.map((location, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card className={classes.locationCard} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {location.library || 'مكتبة غير معروفة'}
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" className={classes.label}>
                          الدولة:
                        </Typography>
                        <Typography variant="body2">
                          {location.country || 'غير محدد'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" className={classes.label}>
                          المدينة:
                        </Typography>
                        <Typography variant="body2">
                          {location.city || 'غير محدد'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" className={classes.label}>
                          رقم الحفظ:
                        </Typography>
                        <Typography variant="body2">
                          {location.catalog_num || 'غير محدد'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1">
            لا توجد معلومات عن نسخ هذا المخطوط
          </Typography>
        )}
      </Paper>
    </div>
  );
};

export default ManuscriptDetails;